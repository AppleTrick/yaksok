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

    @Transactional
    public SupplementAnalysisResponse processAnalysisResult(Long userId, FastApiAnalysisResult aiResult) {

        List<SupplementAnalysisResponse.ProductDisplayInfo> displayInfos = new ArrayList<>();
        List<SupplementAnalysisResponse.ReportProductInfo> reportInfos = new ArrayList<>();

        Map<String, BigDecimal> currentIntakeMap = getCurrentUserIntake(userId);

        for (FastApiAnalysisResult.RawAnalysisResult raw : aiResult.getAnalysisResults()) {
            // 1. 매칭
            Product product = findProductInDb(raw.getProductName());
            boolean isExactMatch = (product != null && product.getPrdlstNm().equals(raw.getProductName()));

            List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients;

            if (product != null) {
                log.info(">>> [분석] DB에서 제품 발견: {}", product.getPrdlstNm());
                ingredients = getIngredientsFromDb(product);
                calculateOverdose(currentIntakeMap, product.getProductIngredients());
            } else {
                log.info(">>> [분석] DB에 없음 -> LLM 호출 및 저장 시도: {}", raw.getProductName());
                ingredients = fetchAndSaveProductFromLlm(raw.getProductName());
            }

            // 3. Display Data
            displayInfos.add(SupplementAnalysisResponse.ProductDisplayInfo.builder()
                    .name(product != null ? product.getPrdlstNm() : raw.getProductName())
                    .box(raw.getBox())
                    .confidence(raw.getConfidence())
                    .isExactMatch(isExactMatch)
                    .build());

            // 4. Report Data
            reportInfos.add(SupplementAnalysisResponse.ReportProductInfo.builder()
                    .productId(product != null ? product.getId() : null)
                    .name(product != null ? product.getPrdlstNm() : raw.getProductName())
                    .confidence(raw.getConfidence())
                    .ingredients(ingredients)
                    .build());
        }

        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis = generateOverdoseReport(currentIntakeMap);

        return SupplementAnalysisResponse.builder()
                .displayData(SupplementAnalysisResponse.DisplayData.builder()
                        .objectCount(displayInfos.size())
                        .products(displayInfos)
                        .build())
                .reportData(SupplementAnalysisResponse.ReportData.builder()
                        .products(reportInfos)
                        .overdoseAnalysis(overdoseAnalysis)
                        .build())
                .build();
    }

    private Product findProductInDb(String rawName) {
        if (rawName == null || rawName.isEmpty()) return null;
        Optional<Product> exact = productRepository.findByPrdlstNm(rawName);
        if (exact.isPresent()) return exact.get();
        List<Product> candidates = productRepository.findByPrdlstNmContaining(rawName);
        if (candidates.isEmpty()) return null;
        return candidates.stream()
                .min(Comparator.comparingInt(p -> Math.abs(p.getPrdlstNm().length() - rawName.length())))
                .orElse(null);
    }

    /**
     * LLM 호출 및 DB 저장 로직
     */
    private List<SupplementAnalysisResponse.ProductIngredientInfo> fetchAndSaveProductFromLlm(String rawProductName) {
        log.info(">>> [LLM] 제품 '{}' 성분 정보 추출 요청 시작 (Temperature: Default)", rawProductName);

        Map<String, Object> params = Map.of("productName", rawProductName);

        var extractionResult = llmServiceFacade.querySafe(
                productExtractionPrompt,
                params,
                com.ssafy.yaksok.global.common.dto.ProductExtractionResponse.class
        );

        if (extractionResult == null) {
            log.warn("<<< [LLM] 성분 정보 추출 실패 (응답 Null)");
            return Collections.emptyList();
        }

        log.info("<<< [LLM] 데이터 수신 완료. DB 저장을 시작합니다.");

        // 1. 제품(Product) 저장
        Product product = Product.builder()
                .prdlstNm(extractionResult.getProductName())
                .primaryFnclty(extractionResult.getPrimaryFunction())
                .ntkMthd(extractionResult.getIntakeMethod())
                .iftknAtntMatrCn(extractionResult.getPrecautions())
                .build();

        Product savedProduct = productRepository.save(product);
        log.info("    [DB 저장] Product 테이블 저장 완료: ID={}, Name={}", savedProduct.getId(), savedProduct.getPrdlstNm());

        List<SupplementAnalysisResponse.ProductIngredientInfo> uiResultList = new ArrayList<>();

        // 2. 성분(Ingredient) 및 연결(ProductIngredient) 저장
        for (var ingInfo : extractionResult.getIngredients()) {
            BigDecimal rawAmount = ingInfo.getAmountAsBigDecimal();
            String rawUnit = ingInfo.getUnit();
            String ingName = ingInfo.getName().trim();

            if (rawAmount.compareTo(BigDecimal.ZERO) <= 0 ||
                    rawUnit == null || rawUnit.contains("정보") || rawUnit.contains("없음")) {

                uiResultList.add(SupplementAnalysisResponse.ProductIngredientInfo.builder()
                        .name(ingName).amount(ingInfo.getAmount()).unit(rawUnit).build());
                continue;
            }

            // 단위 변환
            ConversionResult conv = unitConverter.convert(ingName, rawAmount, rawUnit);

            // [로그 수정] 성분명 포함하여 명확하게 출력
            if (conv.isSuccess()) {
                log.info("    -> [단위 변환] [{}] {} {} => {} {}",
                        ingName, rawAmount, rawUnit, conv.getAmount(), conv.getUnit());
            } else {
                log.warn("    -> [변환 실패] [{}] {} {} (유지)", ingName, rawAmount, rawUnit);
            }

            BigDecimal finalAmount = conv.isSuccess() ? conv.getAmount() : rawAmount;
            String finalUnit = conv.isSuccess() ? conv.getUnit() : rawUnit;

            // 성분 저장
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

            // 연결 정보 저장
            productIngredientRepository.save(ProductIngredient.builder()
                    .product(savedProduct)
                    .ingredient(ingredient)
                    .ingredientAmount(finalAmount)
                    .amountUnit(finalUnit)
                    .build());

            uiResultList.add(SupplementAnalysisResponse.ProductIngredientInfo.builder()
                    .name(ingName)
                    .amount(finalAmount.toString())
                    .unit(finalUnit)
                    .build());
        }

        log.info(">>> [DB 저장] 모든 데이터 저장 완료. 총 성분 수: {}", uiResultList.size());
        return uiResultList;
    }

    private Map<String, BigDecimal> getCurrentUserIntake(Long userId) {
        List<IngredientSummary> summaries = overdoseRepository.findIngredientSummaryByUserId(userId);
        return summaries.stream()
                .collect(Collectors.toMap(
                        IngredientSummary::getIngredientName,
                        s -> BigDecimal.valueOf(s.getTotalAmount()),
                        BigDecimal::add
                ));
    }

    private List<SupplementAnalysisResponse.ProductIngredientInfo> getIngredientsFromDb(Product product) {
        return product.getProductIngredients().stream()
                .map(pi -> SupplementAnalysisResponse.ProductIngredientInfo.builder()
                        .name(pi.getIngredient().getIngredientName())
                        .amount(pi.getIngredientAmount().toString())
                        .unit(pi.getAmountUnit())
                        .build())
                .toList();
    }

    private void calculateOverdose(Map<String, BigDecimal> intakeMap, List<ProductIngredient> newIngredients) {
        for (ProductIngredient pi : newIngredients) {
            String name = pi.getIngredient().getIngredientName();
            BigDecimal amount = pi.getIngredientAmount();
            intakeMap.merge(name, amount, BigDecimal::add);
        }
    }

    private SupplementAnalysisResponse.OverdoseAnalysis generateOverdoseReport(Map<String, BigDecimal> intakeMap) {
        return SupplementAnalysisResponse.OverdoseAnalysis.builder()
                .comparison(new ArrayList<>())
                .recommendations(SupplementAnalysisResponse.Recommendations.builder()
                        .productNotes(List.of("분석 완료"))
                        .interactions(new ArrayList<>())
                        .dosageInfo(new ArrayList<>())
                        .build())
                .build();
    }
}