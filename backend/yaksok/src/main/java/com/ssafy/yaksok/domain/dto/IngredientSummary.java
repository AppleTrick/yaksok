package com.ssafy.yaksok.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 성분별 합산 결과 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientSummary {
    private Long ingredientId;
    private String ingredientName;
    private BigDecimal totalAmount; // 합산된 일일 섭취량
    private String unit; // 단위
    private BigDecimal maxIntakeValue; // 권장 최대 섭취량
    private BigDecimal minIntakeValue; // 권장 최소 섭취량
}
