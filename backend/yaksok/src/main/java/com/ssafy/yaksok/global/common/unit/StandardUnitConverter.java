package com.ssafy.yaksok.global.common.unit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Set;

/**
 * 표준 단위 변환기
 *
 * mg, μg, g, mcg 간 변환을 처리합니다.
 */
@Slf4j
@Component
public class StandardUnitConverter implements UnitConverter {

    private UnitConverter next;

    // 식약처 표준 단위
    private static final Set<String> STANDARD_UNITS = Set.of("mg", "μg", "g", "mcg", "ug");

    // 단위 변환 테이블 (모두 mg 기준)
    private static final Map<String, BigDecimal> TO_MG = Map.of(
            "mg", BigDecimal.ONE,                           // 1 mg = 1 mg
            "μg", new BigDecimal("0.001"),                  // 1 μg = 0.001 mg
            "mcg", new BigDecimal("0.001"),                 // 1 mcg = 0.001 mg
            "ug", new BigDecimal("0.001"),                  // 1 ug = 0.001 mg (μg와 동일)
            "g", new BigDecimal("1000")                     // 1 g = 1000 mg
    );

    @Override
    public boolean canConvert(String fromUnit, String ingredientName) {
        String normalized = fromUnit.toLowerCase();
        return STANDARD_UNITS.contains(normalized);
    }

    @Override
    public ConversionResult convert(
            String ingredientName,
            BigDecimal amount,
            String fromUnit
    ) {
        log.debug("[StandardUnitConverter] 변환 시도: {} {} {}", amount, fromUnit, ingredientName);

        String normalizedUnit = fromUnit.toLowerCase();

        // 이미 표준 단위면 그대로 반환
        if (STANDARD_UNITS.contains(normalizedUnit)) {
            log.info("[StandardUnitConverter] 이미 표준 단위: {} {}", amount, fromUnit);

            // μg와 mcg 통일 (μg로)
            String standardUnit = normalizedUnit.equals("mcg") || normalizedUnit.equals("ug")
                    ? "μg"
                    : fromUnit;

            return ConversionResult.success(amount, standardUnit, getConverterName());
        }

        // 다음 변환기로 위임
        if (next != null) {
            log.debug("[StandardUnitConverter] 다음 변환기로 위임");
            return next.convert(ingredientName, amount, fromUnit);
        }

        return ConversionResult.failed(
                "표준 단위가 아님: " + fromUnit,
                getConverterName()
        );
    }

    /**
     * 단위 변환 (mg 기준으로 변환 후 목표 단위로 변환)
     */
    public BigDecimal convertBetween(BigDecimal amount, String fromUnit, String toUnit) {
        String normalizedFrom = fromUnit.toLowerCase();
        String normalizedTo = toUnit.toLowerCase();

        // 1. fromUnit → mg 변환
        BigDecimal inMg = amount.multiply(TO_MG.get(normalizedFrom));

        // 2. mg → toUnit 변환
        BigDecimal result = inMg.divide(TO_MG.get(normalizedTo), 3, RoundingMode.HALF_UP);

        return result;
    }

    @Override
    public void setNext(UnitConverter next) {
        this.next = next;
    }

    @Override
    public String getConverterName() {
        return "StandardUnitConverter";
    }

    @Override
    public int getPriority() {
        return 20; // IU 다음으로 시도
    }
}