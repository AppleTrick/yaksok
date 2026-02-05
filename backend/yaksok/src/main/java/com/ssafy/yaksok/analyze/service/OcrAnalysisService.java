package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.*;
import com.ssafy.yaksok.analyze.repository.OverdoseRepository;
import com.ssafy.yaksok.global.common.llm.prompt.LLMServiceFacade;
import com.ssafy.yaksok.global.common.llm.prompt.ProductExtractionPrompt;
import com.ssafy.yaksok.global.common.unit.ConversionResult;
import com.ssafy.yaksok.global.common.unit.UnitConverter;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.product.repository.ProductIngredientRepository;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OcrAnalysisService {

        private final ProductRepository productRepository;
        private final IngredientRepository ingredientRepository;
        private final ProductIngredientRepository productIngredientRepository;
        private final OverdoseRepository overdoseRepository;

        private final UnitConverter unitConverter;
        private final LLMServiceFacade llmServiceFacade;
        private final ProductExtractionPrompt productExtractionPrompt;

        /**
         * FastAPI 분석 결과를 정제하여 최종 응답 생성
         * 
         * 1단계: product_name으로 DB 검색
         * 2단계: DB에 있으면 product_ingredient에서 성분 조회
         * 3단계: DB에 없으면 GMS(LLM) 호출하여 제품/성분 정보 추출 및 저장
         * 4단계: product_ingredient에 성분 없으면 GMS로 성분 추출/저장
         * 5단계: userId 기반 현재 섭취량 계산 후 과다섭취 판정
         */
        @Transactional
        public SupplementAnalysisResponse processAnalysisResult(Long userId, FastApiAnalysisResult aiResult) {
                log.info(">>> [분석 시작] User ID: {}, 감지된 제품 수: {}", userId,
                                aiResult.getAnalysisResults() != null ? aiResult.getAnalysisResults().size() : 0);

                // 사용자의 현재 성분별 섭취량 조회
                Map<String, IngredientIntakeInfo> currentIntakeMap = getCurrentUserIntake(userId);
                log.info(">>> [1단계] 유저 현재 섭취량 조회 완료: {} 종류의 성분", currentIntakeMap.size());

                List<SupplementAnalysisResponse.ReportProductInfo> reportProducts = new ArrayList<>();

                if (aiResult.getAnalysisResults() == null || aiResult.getAnalysisResults().isEmpty()) {
                        log.warn(">>> [분석 종료] FastAPI 결과가 비어있습니다.");
                        return SupplementAnalysisResponse.builder()
                                        .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                        .products(reportProducts)
                                                        .build())
                                        .build();
                }

                for (FastApiAnalysisResult.RawAnalysisResult raw : aiResult.getAnalysisResults()) {
                        log.info(">>> [제품 처리] product_name: {}", raw.getProductName());

                        // 1단계: DB에서 제품 검색
                        Product product = findProductInDb(raw.getProductName());

                        List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients;

                        if (product != null) {
                                log.info("    [2단계] DB에서 제품 발견: ID={}, Name={}", product.getId(),
                                                product.getPrdlstNm());

                                // 2단계: product_ingredient에서 성분 조회
                                List<ProductIngredient> productIngredients = product.getProductIngredients();

                                if (productIngredients == null || productIngredients.isEmpty()) {
                                        // 4단계: 성분 없으면 GMS 호출하여 성분 추출/저장
                                        log.info("    [4단계] DB에 성분 정보 없음 -> GMS 호출");
                                        ingredients = fetchAndSaveIngredientsFromLlm(product, raw.getProductName(),
                                                        currentIntakeMap);
                                } else {
                                        // 성분 있으면 바로 사용
                                        ingredients = buildIngredientInfoList(productIngredients, currentIntakeMap);
                                }
                        } else {
                                // 3단계: DB에 없으면 GMS 호출하여 제품/성분 정보 추출 및 저장
                                log.info("    [3단계] DB에 제품 없음 -> GMS 호출하여 제품 및 성분 저장");
                                ProductWithIngredients result = fetchAndSaveProductFromLlm(raw.getProductName(),
                                                currentIntakeMap);
                                product = result.product;
                                ingredients = result.ingredients;
                        }

                        // ReportProductInfo 생성
                        reportProducts.add(SupplementAnalysisResponse.ReportProductInfo.builder()
                                        .productId(product != null ? product.getId() : null)
                                        .name(product != null ? product.getPrdlstNm() : raw.getProductName())
                                        .box(raw.getBox())
                                        .ingredients(ingredients)
                                        .build());
                }

                log.info(">>> [분석 완료] 총 {} 개 제품 처리됨", reportProducts.size());

                return SupplementAnalysisResponse.builder()
                                .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                .products(reportProducts)
                                                .build())
                                .build();
        }

        /**
         * DB에서 제품 검색 (정확 매칭 우선, 부분 매칭 fallback)
         */
        private Product findProductInDb(String rawName) {
                if (rawName == null || rawName.isEmpty())
                        return null;

                // 정확 매칭 시도
                Optional<Product> exact = productRepository.findByPrdlstNm(rawName);
                if (exact.isPresent()) {
                        return exact.get();
                }

                // 부분 매칭 시도 (가장 유사한 이름 선택)
                List<Product> candidates = productRepository.findByPrdlstNmContaining(rawName);
                if (candidates.isEmpty())
                        return null;

                return candidates.stream()
                                .min(Comparator.comparingInt(
                                                p -> Math.abs(p.getPrdlstNm().length() - rawName.length())))
                                .orElse(null);
        }

        /**
         * 현재 유저의 성분별 섭취량 조회
         */
        private Map<String, IngredientIntakeInfo> getCurrentUserIntake(Long userId) {
                List<IngredientSummary> summaries = overdoseRepository.findIngredientSummaryByUserId(userId);
                return summaries.stream()
                                .collect(Collectors.toMap(
                                                IngredientSummary::getIngredientName,
                                                s -> new IngredientIntakeInfo(
                                                                BigDecimal.valueOf(s.getTotalAmount()),
                                                                s.getMaxIntakeValue() != null
                                                                                ? BigDecimal.valueOf(
                                                                                                s.getMaxIntakeValue())
                                                                                : null,
                                                                s.getUnit()),
                                                (a, b) -> a // 중복 시 첫 번째 값 유지
                                ));
        }

        /**
         * ProductIngredient 리스트를 기반으로 응답용 IngredientInfo 생성
         * 과다섭취 판정 포함
         */
        private List<SupplementAnalysisResponse.ProductIngredientInfo> buildIngredientInfoList(
                        List<ProductIngredient> productIngredients,
                        Map<String, IngredientIntakeInfo> currentIntakeMap) {

                List<SupplementAnalysisResponse.ProductIngredientInfo> result = new ArrayList<>();

                for (ProductIngredient pi : productIngredients) {
                        String ingredientName = pi.getIngredient().getIngredientName();
                        BigDecimal amount = pi.getIngredientAmount();
                        String unit = pi.getAmountUnit();

                        // 현재 유저 섭취량 조회
                        IngredientIntakeInfo intakeInfo = currentIntakeMap.get(ingredientName);
                        BigDecimal myAmount = intakeInfo != null ? intakeInfo.currentAmount : BigDecimal.ZERO;
                        BigDecimal maxIntake = intakeInfo != null ? intakeInfo.maxIntake
                                        : (pi.getIngredient().getMaxIntakeValue() != null
                                                        ? pi.getIngredient().getMaxIntakeValue()
                                                        : null);

                        // totalAmount 계산
                        BigDecimal totalAmount = myAmount.add(amount);

                        // status 판정 (maxIntakeValue 초과 시 warning)
                        String status = "safe";
                        if (maxIntake != null && totalAmount.compareTo(maxIntake) > 0) {
                                status = "warning";
                        }

                        result.add(SupplementAnalysisResponse.ProductIngredientInfo.builder()
                                        .name(ingredientName)
                                        .amount(amount.setScale(2, RoundingMode.HALF_UP).toString())
                                        .unit(unit)
                                        .myAmount(myAmount.setScale(2, RoundingMode.HALF_UP).toString())
                                        .totalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP).toString())
                                        .status(status)
                                        .build());
                }

                return result;
        }

        /**
         * GMS(LLM)를 호출하여 제품 정보와 성분 정보를 추출하고 DB에 저장
         */
        private ProductWithIngredients fetchAndSaveProductFromLlm(
                        String rawProductName,
                        Map<String, IngredientIntakeInfo> currentIntakeMap) {

                log.info(">>> [GMS 호출] 제품 '{}' 정보 추출 요청", rawProductName);

                Map<String, Object> params = Map.of("productName", rawProductName);

                com.ssafy.yaksok.global.common.dto.ProductExtractionResponse extractionResult;
                try {
                        extractionResult = llmServiceFacade.queryWithRetry(
                                        productExtractionPrompt,
                                        params,
                                        com.ssafy.yaksok.global.common.dto.ProductExtractionResponse.class,
                                        3); // 최대 3회 재시도
                        log.info("<<< [GMS 응답] productName={}, ingredients count={}",
                                        extractionResult.getProductName(),
                                        extractionResult.getIngredients() != null
                                                        ? extractionResult.getIngredients().size()
                                                        : 0);
                } catch (Exception e) {
                        log.error("<<< [GMS] 호출 실패: {}", e.getMessage(), e);
                        return new ProductWithIngredients(null, Collections.emptyList());
                }

                // Product 저장
                Product product = Product.builder()
                                .prdlstNm(extractionResult.getProductName())
                                .primaryFnclty(extractionResult.getPrimaryFunction())
                                .ntkMthd(extractionResult.getIntakeMethod())
                                .iftknAtntMatrCn(extractionResult.getPrecautions())
                                .build();

                Product savedProduct = productRepository.save(product);
                log.info("    [DB 저장] Product ID={}, Name={}", savedProduct.getId(), savedProduct.getPrdlstNm());

                // 성분 저장 및 IngredientInfo 생성
                List<SupplementAnalysisResponse.ProductIngredientInfo> ingredientInfos = new ArrayList<>();

                for (var ingInfo : extractionResult.getIngredients()) {
                        BigDecimal rawAmount = ingInfo.getAmountAsBigDecimal();
                        String rawUnit = ingInfo.getUnit();
                        String ingName = ingInfo.getName().trim();

                        if (rawAmount.compareTo(BigDecimal.ZERO) <= 0 ||
                                        rawUnit == null || rawUnit.contains("정보") || rawUnit.contains("없음")) {
                                ingredientInfos.add(createIngredientInfo(ingName, ingInfo.getAmount(), rawUnit,
                                                currentIntakeMap, null));
                                continue;
                        }

                        // 단위 변환
                        ConversionResult conv = unitConverter.convert(ingName, rawAmount, rawUnit);
                        BigDecimal finalAmount = conv.isSuccess() ? conv.getAmount() : rawAmount;
                        String finalUnit = conv.isSuccess() ? conv.getUnit() : rawUnit;

                        // Ingredient 저장 또는 조회
                        Ingredient ingredient = ingredientRepository.findByIngredientName(ingName)
                                        .orElseGet(() -> {
                                                log.info("    [DB 저장] 새로운 성분 등록: {}", ingName);
                                                return ingredientRepository.save(Ingredient.builder()
                                                                .ingredientName(ingName)
                                                                .displayUnit(finalUnit)
                                                                .minIntakeValue(BigDecimal.ZERO)
                                                                .maxIntakeValue(BigDecimal.valueOf(9999))
                                                                .build());
                                        });

                        // ProductIngredient 연결 저장
                        productIngredientRepository.save(ProductIngredient.builder()
                                        .product(savedProduct)
                                        .ingredient(ingredient)
                                        .ingredientAmount(finalAmount)
                                        .amountUnit(finalUnit)
                                        .build());

                        ingredientInfos.add(createIngredientInfo(ingName, finalAmount.toString(), finalUnit,
                                        currentIntakeMap, ingredient.getMaxIntakeValue()));
                }

                log.info(">>> [GMS 처리 완료] 총 {} 개 성분 저장됨", ingredientInfos.size());

                return new ProductWithIngredients(savedProduct, ingredientInfos);
        }

        /**
         * 기존 제품에 성분이 없을 때 GMS로 성분만 추출하여 기존 제품에 연결/저장
         */
        private List<SupplementAnalysisResponse.ProductIngredientInfo> fetchAndSaveIngredientsFromLlm(
                        Product existingProduct,
                        String rawProductName,
                        Map<String, IngredientIntakeInfo> currentIntakeMap) {

                log.info(">>> [GMS 호출] 기존 제품 '{}'(ID={})에 대한 성분 정보 추출 요청",
                                existingProduct.getPrdlstNm(), existingProduct.getId());

                Map<String, Object> params = Map.of("productName", rawProductName);

                com.ssafy.yaksok.global.common.dto.ProductExtractionResponse extractionResult;
                try {
                        extractionResult = llmServiceFacade.queryWithRetry(
                                        productExtractionPrompt,
                                        params,
                                        com.ssafy.yaksok.global.common.dto.ProductExtractionResponse.class,
                                        3); // 최대 3회 재시도
                        log.info("<<< [GMS 응답] productName={}, ingredients count={}",
                                        extractionResult.getProductName(),
                                        extractionResult.getIngredients() != null
                                                        ? extractionResult.getIngredients().size()
                                                        : 0);
                } catch (Exception e) {
                        log.error("<<< [GMS] 호출 실패: {}", e.getMessage(), e);
                        return Collections.emptyList();
                }

                if (extractionResult.getIngredients() == null || extractionResult.getIngredients().isEmpty()) {
                        log.warn("<<< [GMS] 성분 정보 없음 - 기존 제품에 성분 연결 실패");
                        return Collections.emptyList();
                }

                log.info("<<< [GMS] 응답 수신: {} 개의 성분 정보", extractionResult.getIngredients().size());

                List<SupplementAnalysisResponse.ProductIngredientInfo> ingredientInfos = new ArrayList<>();

                for (var ingInfo : extractionResult.getIngredients()) {
                        BigDecimal rawAmount = ingInfo.getAmountAsBigDecimal();
                        String rawUnit = ingInfo.getUnit();
                        String ingName = ingInfo.getName().trim();

                        if (rawAmount.compareTo(BigDecimal.ZERO) <= 0 ||
                                        rawUnit == null || rawUnit.contains("정보") || rawUnit.contains("없음")) {
                                ingredientInfos.add(createIngredientInfo(ingName, ingInfo.getAmount(), rawUnit,
                                                currentIntakeMap, null));
                                continue;
                        }

                        // 단위 변환
                        ConversionResult conv = unitConverter.convert(ingName, rawAmount, rawUnit);
                        BigDecimal finalAmount = conv.isSuccess() ? conv.getAmount() : rawAmount;
                        String finalUnit = conv.isSuccess() ? conv.getUnit() : rawUnit;

                        // Ingredient 저장 또는 조회
                        Ingredient ingredient = ingredientRepository.findByIngredientName(ingName)
                                        .orElseGet(() -> {
                                                log.info("    [DB 저장] 새로운 성분 등록: {}", ingName);
                                                return ingredientRepository.save(Ingredient.builder()
                                                                .ingredientName(ingName)
                                                                .displayUnit(finalUnit)
                                                                .minIntakeValue(BigDecimal.ZERO)
                                                                .maxIntakeValue(BigDecimal.valueOf(9999))
                                                                .build());
                                        });

                        // 기존 제품에 ProductIngredient 연결 저장
                        productIngredientRepository.save(ProductIngredient.builder()
                                        .product(existingProduct)
                                        .ingredient(ingredient)
                                        .ingredientAmount(finalAmount)
                                        .amountUnit(finalUnit)
                                        .build());

                        ingredientInfos.add(createIngredientInfo(ingName, finalAmount.toString(), finalUnit,
                                        currentIntakeMap, ingredient.getMaxIntakeValue()));
                }

                log.info(">>> [GMS 처리 완료] 기존 제품 ID={}에 {} 개 성분 연결됨",
                                existingProduct.getId(), ingredientInfos.size());

                return ingredientInfos;
        }

        /**
         * IngredientInfo 생성 헬퍼
         */
        private SupplementAnalysisResponse.ProductIngredientInfo createIngredientInfo(
                        String name, String amount, String unit,
                        Map<String, IngredientIntakeInfo> currentIntakeMap,
                        BigDecimal maxIntakeFromDb) {

                BigDecimal amountDecimal;
                try {
                        amountDecimal = new BigDecimal(amount);
                } catch (NumberFormatException e) {
                        amountDecimal = BigDecimal.ZERO;
                }

                IngredientIntakeInfo intakeInfo = currentIntakeMap.get(name);
                BigDecimal myAmount = intakeInfo != null ? intakeInfo.currentAmount : BigDecimal.ZERO;
                BigDecimal maxIntake = intakeInfo != null ? intakeInfo.maxIntake : maxIntakeFromDb;

                BigDecimal totalAmount = myAmount.add(amountDecimal);

                String status = "safe";
                if (maxIntake != null && totalAmount.compareTo(maxIntake) > 0) {
                        status = "warning";
                }

                return SupplementAnalysisResponse.ProductIngredientInfo.builder()
                                .name(name)
                                .amount(amountDecimal.setScale(2, RoundingMode.HALF_UP).toString())
                                .unit(unit)
                                .myAmount(myAmount.setScale(2, RoundingMode.HALF_UP).toString())
                                .totalAmount(totalAmount.setScale(2, RoundingMode.HALF_UP).toString())
                                .status(status)
                                .build();
        }

        // ===== 내부 헬퍼 클래스 =====

        private static class IngredientIntakeInfo {
                BigDecimal currentAmount;
                BigDecimal maxIntake;
                String unit;

                IngredientIntakeInfo(BigDecimal currentAmount, BigDecimal maxIntake, String unit) {
                        this.currentAmount = currentAmount;
                        this.maxIntake = maxIntake;
                        this.unit = unit;
                }
        }

        private static class ProductWithIngredients {
                Product product;
                List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients;

                ProductWithIngredients(Product product,
                                List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients) {
                        this.product = product;
                        this.ingredients = ingredients;
                }
        }
}