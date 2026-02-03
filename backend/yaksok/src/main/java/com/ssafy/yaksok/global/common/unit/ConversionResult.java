package com.ssafy.yaksok.global.common.unit;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * 단위 변환 결과 DTO
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ConversionResult {

    private final boolean success;
    private final BigDecimal amount;
    private final String unit;
    private final String error;
    private final String converterName;

    /**
     * 성공 결과 생성
     */
    public static ConversionResult success(BigDecimal amount, String unit, String converterName) {
        return new ConversionResult(true, amount, unit, null, converterName);
    }

    /**
     * 실패 결과 생성
     */
    public static ConversionResult failed(String error) {
        return new ConversionResult(false, null, null, error, null);
    }

    /**
     * 실패 결과 생성 (변환기 명시)
     */
    public static ConversionResult failed(String error, String converterName) {
        return new ConversionResult(false, null, null, error, converterName);
    }

    @Override
    public String toString() {
        if (success) {
            return String.format("Success: %s %s (by %s)", amount, unit, converterName);
        } else {
            return String.format("Failed: %s", error);
        }
    }
}