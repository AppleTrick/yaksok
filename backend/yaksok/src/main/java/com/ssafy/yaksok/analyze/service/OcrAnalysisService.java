package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.*;
import com.ssafy.yaksok.global.common.dto.ProductExtractionResponse;
import com.ssafy.yaksok.global.common.llm.prompt.LLMServiceFacade;
import com.ssafy.yaksok.global.common.llm.prompt.ProductExtractionPrompt;
import com.ssafy.yaksok.global.common.unit.ConversionResult;
import com.ssafy.yaksok.global.common.unit.UnitConverter;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.product.repository.ProductRepository;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import com.ssafy.yaksok.ingredient.repository.IngredientRepository;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OCR 분석 서비스
 *
 * FastAPI로부터 받은 Vision API 분석 결과를 처리하고
 * DB 매칭, 단위 변환, 과복용 분석을 수행합니다.
 */
@Slf4j
@Service
public class OcrAnalysisService {

    private final LLMServiceFacade llmService;
    private final UnitConverter unitConverter;
    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;

    private static final String STANDARD_UNIT = "mg"; // 내부 계산용 표준 단위

    public OcrAnalysisService(
            LLMServiceFacade llmService,
            @Qualifier("unitConverterChain") UnitConverter unitConverter,
            ProductRepository productRepository,
            IngredientRepository ingredientRepository) {
        this.llmService = llmService;
        this.unitConverter = unitConverter;
        this.productRepository = productRepository;
        this.ingredientRepository = ingredientRepository;
    }

    /**
     * FastAPI 분석 결과를 처리하여 통합 응답 생성
     *
     * @param userId 사용자 ID
     * @param aiResult FastAPI Vision API 분석 결과
     * @return 통합 분석 응답
     */
    @Transactional(readOnly = true)
    public SupplementAnalysisResponse processAnalysisResult(Long userId, FastApiAnalysisResult aiResult) {
        log.info("분석 결과 처리 시작: User {}, 감지된 객체 {}개",
                userId, aiResult.getAnalysisResults().size());

        // 1. 각 분석 결과별로 DB 매칭 수행
        List<ProductMatchResult> matches = aiResult.getAnalysisResults().stream()
                .map(this::matchProductFromAnalysisResult)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        log.info("DB 매칭 완료: {}/{}개 성공",
                matches.size(), aiResult.getAnalysisResults().size());

        // 2. 과복용 분석 수행
        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis =
                performOverdoseAnalysis(userId, matches);

        // 3. 최종 응답 생성
        return createResponse(matches, overdoseAnalysis);
    }

    /**
     * 단일 분석 결과를 DB 제품과 매칭 (제품명 기반)
     */
    private ProductMatchResult matchProductFromAnalysisResult(
            FastApiAnalysisResult.RawAnalysisResult analysisResult) {

        String productName = analysisResult.getProductName();

        log.debug("제품 매칭 시도: name={}", productName);

        // 제품명 매칭
        if (productName != null && !productName.isEmpty()) {
            Optional<Product> nameMatch = findBestProductMatch(productName);
            if (nameMatch.isPresent()) {
                log.info("제품명 매칭 성공: {}", productName);
                return buildMatchResult(
                        nameMatch.get(),
                        analysisResult,
                        true,  // exactMatch
                        analysisResult.getConfidence()
                );
            }
        }

        log.warn("매칭 실패: {}", productName);
        return null;
    }

    /**
     * 제품명으로 최적 매칭 찾기 (간단한 LIKE 검색)
     */
    private Optional<Product> findBestProductMatch(String productName) {
        // 원본 제품명으로 검색 (공백, 특수문자 포함)
        List<Product> candidates = productRepository.findByPrdlstNmContaining(productName);

        if (!candidates.isEmpty()) {
            return Optional.of(candidates.get(0));
        }

        // 검색 실패 시 정규화해서 재시도
        String normalized = normalizeProductName(productName);
        candidates = productRepository.findByPrdlstNmContaining(normalized);

        return candidates.isEmpty() ? Optional.empty() : Optional.of(candidates.get(0));
    }

    /**
     * 제품명 정규화 (백업용)
     */
    private String normalizeProductName(String name) {
        return name.replaceAll("\\s+", "")
                .toLowerCase()
                .replaceAll("[^가-힣a-z0-9]", "");
    }

    /**
     * ProductMatchResult 객체 생성
     */
    private ProductMatchResult buildMatchResult(
            Product product,
            FastApiAnalysisResult.RawAnalysisResult analysisResult,
            boolean exactMatch,
            double confidence) {

        // 제품의 성분 정보 조회
        List<ProductIngredientResponse> ingredients = product.getProductIngredients()
                .stream()
                .map(this::toIngredientResponse)
                .collect(Collectors.toList());

        return ProductMatchResult.builder()
                .product(product)
                .box(analysisResult.getBox())
                .confidence(confidence)
                .barcode(null) // 바코드 미사용
                .exactMatch(exactMatch)
                .ingredients(ingredients)
                .build();
    }

    /**
     * ProductIngredient -> ProductIngredientResponse 변환
     */
    private ProductIngredientResponse toIngredientResponse(ProductIngredient pi) {
        return ProductIngredientResponse.builder()
                .productId(pi.getProduct().getId())
                .ingredientId(pi.getIngredient().getId())
                .name(pi.getIngredient().getIngredientName())
                .amount(pi.getIngredientAmount())
                .unit(pi.getAmountUnit())
                .dailyPercent(calculateDailyPercent(pi))
                .build();
    }

    /**
     * 일일 권장량 대비 퍼센트 계산
     * 🔧 수정: getRecommendedAmount()가 Double 반환하도록 수정
     */
    private int calculateDailyPercent(ProductIngredient pi) {
        Ingredient ingredient = pi.getIngredient();

        Double recommendedAmount = ingredient.getRecommendedAmount();
        if (recommendedAmount == null || recommendedAmount <= 0) {
            return 0;
        }

        try {
            // 단위 변환
            ConversionResult result = unitConverter.convert(
                    ingredient.getIngredientName(),
                    pi.getIngredientAmount(),
                    pi.getAmountUnit()
            );

            if (!result.isSuccess()) {
                return 0;
            }

            double convertedAmount = result.getAmount().doubleValue();
            double recommended = recommendedAmount;

            return (int) ((convertedAmount / recommended) * 100);

        } catch (Exception e) {
            log.warn("일일 권장량 계산 실패: {}", ingredient.getIngredientName(), e);
            return 0;
        }
    }

    /**
     * 과복용 분석 수행
     */
    private SupplementAnalysisResponse.OverdoseAnalysis performOverdoseAnalysis(
            Long userId,
            List<ProductMatchResult> newMatches) {

        // 성분별 합산 (신규 제품만)
        Map<String, IngredientAmount> ingredientMap = new HashMap<>();

        for (ProductMatchResult match : newMatches) {
            for (ProductIngredientResponse ingredient : match.getIngredients()) {
                String name = ingredient.getName();

                try {
                    // 단위 변환
                    ConversionResult result = unitConverter.convert(
                            name,
                            ingredient.getAmount(),
                            ingredient.getUnit()
                    );

                    if (result.isSuccess()) {
                        ingredientMap.merge(
                                name,
                                new IngredientAmount(
                                        result.getAmount().doubleValue(),
                                        result.getUnit()
                                ),
                                (old, newVal) -> new IngredientAmount(
                                        old.amount + newVal.amount,
                                        old.unit
                                )
                        );
                    }
                } catch (Exception e) {
                    log.warn("단위 변환 실패: {}", name, e);
                }
            }
        }

        // 비교 결과 생성
        List<SupplementAnalysisResponse.ComparisonResult> comparisons =
                ingredientMap.entrySet().stream()
                        .map(entry -> createComparisonResult(entry.getKey(), entry.getValue()))
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());

        // 권장사항 생성
        SupplementAnalysisResponse.Recommendations recommendations =
                generateRecommendations(comparisons);

        return SupplementAnalysisResponse.OverdoseAnalysis.builder()
                .comparison(comparisons)
                .recommendations(recommendations)
                .build();
    }

    /**
     * 성분별 비교 결과 생성
     */
    private SupplementAnalysisResponse.ComparisonResult createComparisonResult(
            String ingredientName,
            IngredientAmount amount) {

        // TODO: 기존 복용 중인 제품의 해당 성분량 조회 (userId 활용)
        // 여기서는 간단히 신규 제품만 표시

        String status = determineStatus(ingredientName, amount.amount);

        return SupplementAnalysisResponse.ComparisonResult.builder()
                .name(ingredientName)
                .myAmount("0") // TODO: 기존 복용량
                .newAmount(String.format("%.2f", amount.amount))
                .totalAmount(String.format("%.2f", amount.amount))
                .status(status)
                .build();
    }

    /**
     * 성분 상태 판단 (good/warning/new)
     * 🔧 수정: BigDecimal 비교 시 compareTo() 사용
     */
    private String determineStatus(String ingredientName, double totalAmount) {
        // Ingredient 조회
        Optional<Ingredient> ingredientOpt = ingredientRepository
                .findByIngredientNameContaining(ingredientName)
                .stream()
                .findFirst();

        if (ingredientOpt.isEmpty()) {
            return "new";
        }

        Ingredient ingredient = ingredientOpt.get();

        // 상한 섭취량 체크 (BigDecimal 비교 수정)
        BigDecimal maxIntakeValue = ingredient.getMaxIntakeValue();
        if (maxIntakeValue != null) {
            BigDecimal totalAmountDecimal = BigDecimal.valueOf(totalAmount);
            // compareTo: this < other -> -1, this == other -> 0, this > other -> 1
            if (maxIntakeValue.compareTo(totalAmountDecimal) < 0) {
                return "warning";
            }
        }

        return "good";
    }

    /**
     * 권장사항 생성
     */
    private SupplementAnalysisResponse.Recommendations generateRecommendations(
            List<SupplementAnalysisResponse.ComparisonResult> comparisons) {

        List<SupplementAnalysisResponse.InteractionInfo> interactions = new ArrayList<>();
        List<SupplementAnalysisResponse.DosageInfo> dosageInfo = new ArrayList<>();

        // Warning 상태인 성분에 대한 안내
        comparisons.stream()
                .filter(c -> "warning".equals(c.getStatus()))
                .forEach(c -> {
                    interactions.add(
                            SupplementAnalysisResponse.InteractionInfo.builder()
                                    .type("warning")
                                    .text(c.getName() + "의 섭취량이 권장량을 초과합니다.")
                                    .build()
                    );
                });

        // 기본 안내사항
        if (interactions.isEmpty()) {
            interactions.add(
                    SupplementAnalysisResponse.InteractionInfo.builder()
                            .type("tip")
                            .text("현재 섭취량은 적절한 수준입니다.")
                            .build()
            );
        }

        return SupplementAnalysisResponse.Recommendations.builder()
                .interactions(interactions)
                .dosageInfo(dosageInfo)
                .productNotes(Collections.emptyList())
                .build();
    }

    /**
     * 최종 응답 생성
     */
    private SupplementAnalysisResponse createResponse(
            List<ProductMatchResult> matches,
            SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis) {

        // DisplayData 생성
        List<SupplementAnalysisResponse.ProductDisplayInfo> displayInfos = matches.stream()
                .map(m -> SupplementAnalysisResponse.ProductDisplayInfo.builder()
                        .tempId(m.getProduct().getId())
                        .name(m.getProduct().getPrdlstNm())
                        .barcode(null) // 바코드 미사용
                        .confidence(m.getConfidence())
                        .box(m.getBox())
                        .isExactMatch(m.isExactMatch())
                        .build())
                .collect(Collectors.toList());

        // ReportData 생성
        List<SupplementAnalysisResponse.ReportProductInfo> reportInfos = matches.stream()
                .map(m -> {
                    List<SupplementAnalysisResponse.ProductIngredientInfo> ingredientInfos =
                            m.getIngredients().stream()
                                    .map(this::toProductIngredientInfo)
                                    .collect(Collectors.toList());

                    return SupplementAnalysisResponse.ReportProductInfo.builder()
                            .productId(m.getProduct().getId())
                            .name(m.getProduct().getPrdlstNm())
                            .confidence(m.getConfidence())
                            .ingredients(ingredientInfos)
                            .build();
                })
                .collect(Collectors.toList());

        return SupplementAnalysisResponse.builder()
                .displayData(
                        SupplementAnalysisResponse.DisplayData.builder()
                                .objectCount(matches.size())
                                .products(displayInfos)
                                .build()
                )
                .reportData(
                        SupplementAnalysisResponse.ReportData.builder()
                                .products(reportInfos)
                                .overdoseAnalysis(overdoseAnalysis)
                                .build()
                )
                .build();
    }

    /**
     * ProductIngredientResponse -> ProductIngredientInfo 변환
     */
    private SupplementAnalysisResponse.ProductIngredientInfo toProductIngredientInfo(
            ProductIngredientResponse ingredient) {

        return SupplementAnalysisResponse.ProductIngredientInfo.builder()
                .name(ingredient.getName())
                .amount(ingredient.getAmount().toString())
                .unit(ingredient.getUnit())
                .dailyPercent(ingredient.getDailyPercent())
                .build();
    }

    /**
     * 성분량 저장용 내부 클래스
     */
    private static class IngredientAmount {
        double amount;
        String unit;

        IngredientAmount(double amount, String unit) {
            this.amount = amount;
            this.unit = unit;
        }
    }
}