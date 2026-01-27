package com.ssafy.yaksok.ingredient.dto;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * 단위 변환 결과 DTO
 */
@Getter
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class UnitConversionResultDto {

    private boolean success;
    private BigDecimal amount;
    private String unit;
    private String error;

    /**
     * 성공 결과 생성
     */
    public static UnitConversionResultDto success(BigDecimal amount, String unit) {
        return new UnitConversionResultDto(true, amount, unit, null);
    }

    /**
     * 실패 결과 생성
     */
    public static UnitConversionResultDto failed(String error) {
        return new UnitConversionResultDto(false, null, null, error);
    }
}