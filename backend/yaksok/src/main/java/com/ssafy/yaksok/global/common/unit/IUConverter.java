package com.ssafy.yaksok.global.common.unit;

import com.ssafy.yaksok.global.common.text.TextNormalizer;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

/**
 * IU 단위 변환기
 *
 * IU(International Unit)를 식약처 표준 단위로 변환합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class IUConverter implements UnitConverter {

    private final TextNormalizer textNormalizer;
    private UnitConverter next;

    // IU 변환 테이블 (식약처 기준)
    private static final Map<String, ConversionFactor> IU_TABLE = new HashMap<>();

    static {
        // 비타민 A: 1 IU = 0.3 μg (레티놀)
        IU_TABLE.put("비타민A", new ConversionFactor(new BigDecimal("0.3"), "μg"));
        IU_TABLE.put("VITAMINA", new ConversionFactor(new BigDecimal("0.3"), "μg"));
        IU_TABLE.put("RETINOL", new ConversionFactor(new BigDecimal("0.3"), "μg"));

        // 비타민 D: 1 IU = 0.025 μg
        IU_TABLE.put("비타민D", new ConversionFactor(new BigDecimal("0.025"), "μg"));
        IU_TABLE.put("VITAMIND", new ConversionFactor(new BigDecimal("0.025"), "μg"));
        IU_TABLE.put("VITAMIN D", new ConversionFactor(new BigDecimal("0.025"), "μg"));
        IU_TABLE.put("VITAMIN D3", new ConversionFactor(new BigDecimal("0.025"), "μg"));
        IU_TABLE.put("CHOLECALCIFEROL", new ConversionFactor(new BigDecimal("0.025"), "μg"));

        // 비타민 E: 1 IU = 0.67 mg (d-알파-토코페롤)
        IU_TABLE.put("비타민E", new ConversionFactor(new BigDecimal("0.67"), "mg"));
        IU_TABLE.put("VITAMINE", new ConversionFactor(new BigDecimal("0.67"), "mg"));
        IU_TABLE.put("TOCOPHEROL", new ConversionFactor(new BigDecimal("0.67"), "mg"));
    }

    @Override
    public boolean canConvert(String fromUnit, String ingredientName) {
        if (!"IU".equalsIgnoreCase(fromUnit)) {
            return false;
        }

        String normalized = normalizeIngredientName(ingredientName);
        return IU_TABLE.containsKey(normalized);
    }

    @Override
    public ConversionResult convert(
            String ingredientName,
            BigDecimal amount,
            String fromUnit
    ) {
        log.debug("[IUConverter] 변환 시도: {} {} {}", amount, fromUnit, ingredientName);

        if (canConvert(fromUnit, ingredientName)) {
            String normalized = normalizeIngredientName(ingredientName);
            ConversionFactor factor = IU_TABLE.get(normalized);

            BigDecimal result = amount.multiply(factor.getFactor())
                    .setScale(2, RoundingMode.HALF_UP);

            log.info("[IUConverter] 변환 성공: {} IU → {} {}", amount, result, factor.getUnit());
            return ConversionResult.success(result, factor.getUnit(), getConverterName());
        }

        // 다음 변환기로 위임
        if (next != null) {
            log.debug("[IUConverter] 다음 변환기로 위임");
            return next.convert(ingredientName, amount, fromUnit);
        }

        return ConversionResult.failed(
                "IU 변환 테이블에 없는 성분: " + ingredientName,
                getConverterName()
        );
    }

    @Override
    public void setNext(UnitConverter next) {
        this.next = next;
    }

    @Override
    public String getConverterName() {
        return "IUConverter";
    }

    @Override
    public int getPriority() {
        return 10; // 가장 먼저 시도
    }

    /**
     * 성분명 정규화
     */
    private String normalizeIngredientName(String name) {
        return textNormalizer.normalize(name)
                .toUpperCase()
                .replaceAll("\\s+", "");
    }

    /**
     * 변환 계수 (factor + unit)
     */
    @Getter
    @AllArgsConstructor
    private static class ConversionFactor {
        private final BigDecimal factor;
        private final String unit;
    }
}