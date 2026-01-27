package com.ssafy.yaksok.ingredient.util;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * IU 단위를 식약처 표준 단위로 변환하는 유틸리티
 */
@Slf4j
public class IngredientUnitConverter {

    // IU 변환 계수 (식약처 기준)
    private static final Map<String, ConversionFactor> IU_CONVERSION_TABLE = new HashMap<>();

    static {
        // 비타민 A: 1 IU = 0.3 μg (레티놀)
        IU_CONVERSION_TABLE.put("비타민A", new ConversionFactor(new BigDecimal("0.3"), "μg"));
        IU_CONVERSION_TABLE.put("VITAMINA", new ConversionFactor(new BigDecimal("0.3"), "μg"));

        // 비타민 D: 1 IU = 0.025 μg
        IU_CONVERSION_TABLE.put("비타민D", new ConversionFactor(new BigDecimal("0.025"), "μg"));
        IU_CONVERSION_TABLE.put("VITAMIND", new ConversionFactor(new BigDecimal("0.025"), "μg"));

        // 비타민 E: 1 IU = 0.67 mg (d-알파-토코페롤)
        IU_CONVERSION_TABLE.put("비타민E", new ConversionFactor(new BigDecimal("0.67"), "mg"));
        IU_CONVERSION_TABLE.put("VITAMINE", new ConversionFactor(new BigDecimal("0.67"), "mg"));
    }

    /**
     * IU를 표준 단위로 변환
     *
     * @param ingredientName 성분명
     * @param iuValue IU 값
     * @return 변환 결과
     */
    public static ConversionResult convertIUToStandard(String ingredientName, BigDecimal iuValue) {
        log.debug("IU 변환 시도: {} {} IU", ingredientName, iuValue);

        // 성분명 정규화
        String normalized = normalizeIngredientName(ingredientName);

        // 변환 계수 찾기
        ConversionFactor factor = IU_CONVERSION_TABLE.get(normalized);

        if (factor == null) {
            log.warn("IU 변환 테이블에 없는 성분: {}", ingredientName);
            return ConversionResult.failed("지원하지 않는 성분: " + ingredientName);
        }

        // 계산
        BigDecimal result = iuValue.multiply(factor.getFactor())
                .setScale(2, RoundingMode.HALF_UP);

        log.info("IU 변환 성공: {} IU → {} {}", iuValue, result, factor.getUnit());
        return ConversionResult.success(result, factor.getUnit());
    }

    /**
     * 성분명 정규화 (대소문자, 공백 제거)
     */
    private static String normalizeIngredientName(String name) {
        return name.trim()
                .toUpperCase()
                .replaceAll("\\s+", "");
    }

    // ========================================
    // 내부 클래스
    // ========================================

    /**
     * 변환 계수 (factor + unit)
     */
    @Getter
    @AllArgsConstructor
    private static class ConversionFactor {
        private BigDecimal factor;
        private String unit;
    }

    /**
     * 변환 결과
     */
    @Getter
    @AllArgsConstructor(access = AccessLevel.PRIVATE)
    public static class ConversionResult {
        private boolean success;
        private BigDecimal value;
        private String unit;
        private String error;

        public static ConversionResult success(BigDecimal value, String unit) {
            return new ConversionResult(true, value, unit, null);
        }

        public static ConversionResult failed(String error) {
            return new ConversionResult(false, null, null, error);
        }
    }
}