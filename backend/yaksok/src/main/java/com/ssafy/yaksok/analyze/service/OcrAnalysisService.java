package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.*;
import com.ssafy.yaksok.analyze.repository.OverdoseRepository;
import com.ssafy.yaksok.global.common.dto.IntakeTimeResponse;
import com.ssafy.yaksok.global.common.dto.ProductVerificationResponse;
import com.ssafy.yaksok.global.common.llm.prompt.IntakeTimePrompt;
import com.ssafy.yaksok.global.common.llm.prompt.LLMServiceFacade;
import com.ssafy.yaksok.global.common.llm.prompt.ProductExtractionPrompt;
import com.ssafy.yaksok.global.common.llm.prompt.ProductVerificationPrompt;
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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
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
        private final ProductVerificationPrompt productVerificationPrompt;
        private final IntakeTimePrompt intakeTimePrompt;

        /**
         * FastAPI 분석 결과를 정제하여 최종 응답 생성 (병렬 처리)
         * 
         * 1단계: product_name으로 DB 검색
         * 2단계: DB에 있으면 product_ingredient에서 성분 조회
         * 3단계: DB에 없으면 GMS(LLM) 호출하여 제품/성분 정보 추출 및 저장
         * 4단계: product_ingredient에 성분 없으면 GMS로 성분 추출/저장
         * 5단계: userId 기반 현재 섭취량 계산 후 과다섭취 판정
         */
        @Transactional
        public SupplementAnalysisResponse processAnalysisResult(Long userId, FastApiAnalysisResult aiResult) {
                long methodStart = System.currentTimeMillis();
                int totalProducts = aiResult.getAnalysisResults() != null ? aiResult.getAnalysisResults().size() : 0;
                log.info(">>> [분석 시작] User ID: {}, 감지된 제품 수: {} (병렬 처리)", userId, totalProducts);

                // 사용자의 현재 성분별 섭취량 조회
                long intakeStart = System.currentTimeMillis();
                Map<String, IngredientIntakeInfo> currentIntakeMap = getCurrentUserIntake(userId);
                log.info("[성능측정] 유저 섭취량 조회: {}ms, {} 종류", System.currentTimeMillis() - intakeStart,
                                currentIntakeMap.size());

                if (aiResult.getAnalysisResults() == null || aiResult.getAnalysisResults().isEmpty()) {
                        log.warn(">>> [분석 종료] FastAPI 결과가 비어있습니다.");
                        return SupplementAnalysisResponse.builder()
                                        .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                        .products(Collections.emptyList())
                                                        .build())
                                        .build();
                }

                // 병렬 처리를 위한 ExecutorService 생성 (제품 수 만큼 스레드 풀)
                int threadPoolSize = Math.min(totalProducts, 8); // 최대 8개 스레드
                ExecutorService executor = Executors.newFixedThreadPool(threadPoolSize);
                log.info("[병렬처리] 스레드 풀 생성: {} 스레드", threadPoolSize);

                try {
                        // 각 제품을 병렬로 처리
                        List<CompletableFuture<SupplementAnalysisResponse.ReportProductInfo>> futures = new ArrayList<>();

                        for (int i = 0; i < aiResult.getAnalysisResults().size(); i++) {
                                final FastApiAnalysisResult.RawAnalysisResult raw = aiResult.getAnalysisResults()
                                                .get(i);
                                final int productIndex = i + 1;

                                CompletableFuture<SupplementAnalysisResponse.ReportProductInfo> future = CompletableFuture
                                                .supplyAsync(
                                                                () -> processSingleProduct(raw, productIndex,
                                                                                totalProducts, currentIntakeMap),
                                                                executor);
                                futures.add(future);
                        }

                        // 모든 병렬 작업 완료 대기
                        long parallelStart = System.currentTimeMillis();
                        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
                        log.info("[성능측정] 병렬 처리 완료 대기: {}ms", System.currentTimeMillis() - parallelStart);

                        // 결과 수집 (null 제외 - 검증 실패한 제품)
                        List<SupplementAnalysisResponse.ReportProductInfo> reportProducts = futures.stream()
                                        .map(CompletableFuture::join)
                                        .filter(Objects::nonNull)
                                        .collect(Collectors.toList());

                        log.info("[성능측정] 전체 제품 처리 완료: {}ms, {} 개 제품 (병렬)",
                                        System.currentTimeMillis() - methodStart, reportProducts.size());

                        return SupplementAnalysisResponse.builder()
                                        .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                        .products(reportProducts)
                                                        .build())
                                        .build();
                } finally {
                        executor.shutdown();
                }
        }

        /**
         * 단일 제품 처리 (병렬 실행용)
         */
        private SupplementAnalysisResponse.ReportProductInfo processSingleProduct(
                        FastApiAnalysisResult.RawAnalysisResult raw,
                        int productIndex,
                        int totalProducts,
                        Map<String, IngredientIntakeInfo> currentIntakeMap) {

                long productStart = System.currentTimeMillis();
                log.info(">>> [제품 {}/{}] 처리 시작: {} (스레드: {})",
                                productIndex, totalProducts, raw.getProductName(), Thread.currentThread().getName());

                // 0단계: 제품명 유효성 검증 (OCR 노이즈 필터링)
                long verifyStart = System.currentTimeMillis();
                if (!verifyProductName(raw.getProductName())) {
                        log.warn("    [검증 실패] '{}' - 유효하지 않은 제품명으로 제외 ({}ms)", raw.getProductName(),
                                        System.currentTimeMillis() - verifyStart);
                        return null; // 해당 제품 스킵
                }
                log.info("[성능측정] 제품{} - 제품명 검증: {}ms", productIndex,
                                System.currentTimeMillis() - verifyStart);

                // 섭취시간 LLM을 미리 비동기로 시작 (제품 추출과 병렬 실행)
                log.info("    [5단계-선행] 섭취시간 추천 비동기 시작: '{}'", raw.getProductName());
                long intakeTimeStart = System.currentTimeMillis();
                CompletableFuture<IntakeTimeResponse> intakeTimeFuture = CompletableFuture.supplyAsync(
                                () -> fetchIntakeTime(raw.getProductName()));

                // 1단계: DB에서 제품 검색
                long dbSearchStart = System.currentTimeMillis();
                Product product = findProductInDb(raw.getProductName());
                log.info("[성능측정] 제품{} - DB 검색: {}ms", productIndex, System.currentTimeMillis() - dbSearchStart);

                List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients;

                if (product != null) {
                        log.info("    [2단계] DB에서 제품 발견: ID={}, Name={}", product.getId(),
                                        product.getPrdlstNm());

                        // 2단계: product_ingredient에서 성분 조회
                        List<ProductIngredient> productIngredients = product.getProductIngredients();

                        if (productIngredients == null || productIngredients.isEmpty()) {
                                // 4단계: 성분 없으면 GMS 호출하여 성분 추출/저장
                                log.info("    [4단계] DB에 성분 정보 없음 -> GMS 호출");
                                long llmIngStart = System.currentTimeMillis();
                                ingredients = fetchAndSaveIngredientsFromLlm(product, raw.getProductName(),
                                                currentIntakeMap);
                                log.info("[성능측정] 제품{} - 성분 추출 (LLM): {}ms", productIndex,
                                                System.currentTimeMillis() - llmIngStart);
                        } else {
                                // 성분 있으면 바로 사용
                                ingredients = buildIngredientInfoList(productIngredients, currentIntakeMap);
                        }
                } else {
                        // 3단계: DB에 없으면 GMS 호출하여 제품/성분 정보 추출 및 저장
                        log.info("    [3단계] DB에 제품 없음 -> GMS 호출하여 제품 및 성분 저장");
                        long llmProductStart = System.currentTimeMillis();
                        ProductWithIngredients result = fetchAndSaveProductFromLlm(raw.getProductName(),
                                        currentIntakeMap);
                        log.info("[성능측정] 제품{} - 제품/성분 추출 (LLM): {}ms", productIndex,
                                        System.currentTimeMillis() - llmProductStart);
                        product = result.product;
                        ingredients = result.ingredients;
                }

                // 섭취시간 LLM 결과 대기 (이미 병렬로 실행 완료됨)
                IntakeTimeResponse intakeTimeInfo = null;
                try {
                        intakeTimeInfo = intakeTimeFuture.join();
                        log.info("[성능측정] 제품{} - 섭취시간 추천 (병렬 LLM): {}ms", productIndex,
                                        System.currentTimeMillis() - intakeTimeStart);
                } catch (Exception e) {
                        log.warn("    [섭취시간 오류] 비동기 호출 실패: {}", e.getMessage());
                }

                String productName = product != null ? product.getPrdlstNm() : raw.getProductName();

                log.info("[성능측정] 제품{} - 총 처리 시간: {}ms (스레드: {})", productIndex,
                                System.currentTimeMillis() - productStart, Thread.currentThread().getName());

                // ReportProductInfo 생성
                return SupplementAnalysisResponse.ReportProductInfo.builder()
                                .productId(product != null ? product.getId() : null)
                                .name(productName)
                                .box(raw.getBox())
                                .ingredients(ingredients)
                                .intakeTime(intakeTimeInfo != null ? intakeTimeInfo.getIntakeTime() : null)
                                .intakeCategory(intakeTimeInfo != null ? intakeTimeInfo.getCategory() : null)
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
         * 제품명 유효성 검증 (OCR 노이즈 필터링)
         */
        private boolean verifyProductName(String productName) {
                if (productName == null || productName.trim().isEmpty()) {
                        return false;
                }

                log.info("    [0단계] 제품명 유효성 검증: '{}'", productName);

                String lowerName = productName.toLowerCase().replaceAll("\\s", "");

                // 1. 필리 브랜드 및 주요 영양제 키워드 즉시 통과 (Bypass LLM)
                if (lowerName.contains("필리") || lowerName.contains("pilly") ||
                                lowerName.contains("비타민") || lowerName.contains("vitamin") ||
                                lowerName.contains("칼슘") || lowerName.contains("마그네슘") ||
                                lowerName.contains("루테인") || lowerName.contains("오메가")) {
                        log.info("    [검증 결과] 주요 키워드 포함 확인 -> 무조건 통과");
                        return true;
                }

                try {
                        Map<String, Object> params = Map.of("productName", productName);
                        ProductVerificationResponse result = llmServiceFacade.queryWithRetry(
                                        productVerificationPrompt,
                                        params,
                                        ProductVerificationResponse.class,
                                        0.1,
                                        2);

                        if (result.isValid()) {
                                log.info("    [검증 결과] LLM 승인: {}", result.getReason());
                                return true;
                        }

                        // 2. LLM이 무효라고 해도, 한글 단어가 어느 정도 명확하면 실제품으로 간주하고 통과 (연하게)
                        if (productName.matches(".*[가-힣]{2,}.*")) {
                                log.info("    [검증 완화] LLM 반려되었으나 한글 단어 감지되어 통과: {}", result.getReason());
                                return true;
                        }

                        log.warn("    [검증 기각] 최종적으로 유효하지 않음: {}", result.getReason());
                        return false;
                } catch (Exception e) {
                        log.warn("    [검증 오류] GMS 호출 실패, 안전하게 통과 처리: {}", e.getMessage());
                        return true; // 에러 시에는 사용자 편의를 위해 통과
                }
        }

        /**
         * 영양제 섭취 시간 추천 조회
         */
        private IntakeTimeResponse fetchIntakeTime(String productName) {
                if (productName == null || productName.trim().isEmpty()) {
                        return null;
                }

                log.info("    [5단계] 섭취 시간 추천 조회: '{}'", productName);

                try {
                        Map<String, Object> params = Map.of("productName", productName);
                        IntakeTimeResponse result = llmServiceFacade.queryWithRetry(
                                        intakeTimePrompt,
                                        params,
                                        IntakeTimeResponse.class,
                                        2); // 최대 2회 재시도

                        log.info("    [섭취 시간] intakeTime={}, category={}",
                                        result.getIntakeTime(), result.getCategory());
                        return result;
                } catch (Exception e) {
                        log.warn("    [섭취 시간 오류] GMS 호출 실패: {}", e.getMessage());
                        return null;
                }
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
         * LLM 호출은 병렬로, DB 저장만 동기화하여 성능 최적화
         */
        private ProductWithIngredients fetchAndSaveProductFromLlm(
                        String rawProductName,
                        Map<String, IngredientIntakeInfo> currentIntakeMap) {

                log.info(">>> [GMS 호출] 제품 '{}' 정보 추출 요청", rawProductName);

                Map<String, Object> params = Map.of("productName", rawProductName);

                // LLM 호출 (병렬 실행 가능)
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

                // DB 저장 (동기화 블록으로 보호)
                synchronized (this) {
                        // Product 저장
                        Product product = Product.builder()
                                        .prdlstNm(extractionResult.getProductName())
                                        .primaryFnclty(extractionResult.getPrimaryFunction())
                                        .ntkMthd(extractionResult.getIntakeMethod())
                                        .iftknAtntMatrCn(extractionResult.getPrecautions())
                                        .build();

                        Product savedProduct = productRepository.save(product);
                        log.info("    [DB 저장] Product ID={}, Name={}", savedProduct.getId(),
                                        savedProduct.getPrdlstNm());

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

                                // ProductIngredient 연결 저장 (중복 체크)
                                if (!productIngredientRepository.existsByProductAndIngredient(savedProduct,
                                                ingredient)) {
                                        productIngredientRepository.save(ProductIngredient.builder()
                                                        .product(savedProduct)
                                                        .ingredient(ingredient)
                                                        .ingredientAmount(finalAmount)
                                                        .amountUnit(finalUnit)
                                                        .build());
                                } else {
                                        log.info("    [DB 스킵] 이미 존재하는 ProductIngredient: product={}, ingredient={}",
                                                        savedProduct.getId(), ingName);
                                }

                                ingredientInfos.add(createIngredientInfo(ingName, finalAmount.toString(), finalUnit,
                                                currentIntakeMap, ingredient.getMaxIntakeValue()));
                        }

                        log.info(">>> [GMS 처리 완료] 총 {} 개 성분 저장됨", ingredientInfos.size());

                        return new ProductWithIngredients(savedProduct, ingredientInfos);
                }
        }

        /**
         * 기존 제품에 성분이 없을 때 GMS로 성분만 추출하여 기존 제품에 연결/저장
         * LLM 호출은 병렬로, DB 저장만 동기화하여 성능 최적화
         */
        private List<SupplementAnalysisResponse.ProductIngredientInfo> fetchAndSaveIngredientsFromLlm(
                        Product existingProduct,
                        String rawProductName,
                        Map<String, IngredientIntakeInfo> currentIntakeMap) {

                log.info(">>> [GMS 호출] 기존 제품 '{}'(ID={})에 대한 성분 정보 추출 요청",
                                existingProduct.getPrdlstNm(), existingProduct.getId());

                Map<String, Object> params = Map.of("productName", rawProductName);

                // LLM 호출 (병렬 실행 가능)
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

                // DB 저장 (동기화 블록으로 보호)
                synchronized (this) {
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

                                // 기존 제품에 ProductIngredient 연결 저장 (중복 체크)
                                if (!productIngredientRepository.existsByProductAndIngredient(existingProduct,
                                                ingredient)) {
                                        productIngredientRepository.save(ProductIngredient.builder()
                                                        .product(existingProduct)
                                                        .ingredient(ingredient)
                                                        .ingredientAmount(finalAmount)
                                                        .amountUnit(finalUnit)
                                                        .build());
                                } else {
                                        log.info("    [DB 스킵] 이미 존재하는 ProductIngredient: product={}, ingredient={}",
                                                        existingProduct.getId(), ingName);
                                }

                                ingredientInfos.add(createIngredientInfo(ingName, finalAmount.toString(), finalUnit,
                                                currentIntakeMap, ingredient.getMaxIntakeValue()));
                        }

                        log.info(">>> [GMS 처리 완료] 기존 제품 ID={}에 {} 개 성분 연결됨",
                                        existingProduct.getId(), ingredientInfos.size());

                        return ingredientInfos;
                }
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