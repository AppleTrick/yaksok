package com.ssafy.yaksok.global.common.unit;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.math.BigDecimal;

/**
 * LLM 단위 변환 응답 DTO
 */
@Data
public class UnitConversionResponse {

    private boolean success;

    private BigDecimal amount;

    private String unit;

    private String error;
}