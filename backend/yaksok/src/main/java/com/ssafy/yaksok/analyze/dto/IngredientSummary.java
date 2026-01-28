package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private Double totalAmount; // 합산된 일일 섭취량
    private String unit; // 단위
    private Double maxIntakeValue; // 권장 최대 섭취량
    private Double minIntakeValue; // 권장 최소 섭취량
}
