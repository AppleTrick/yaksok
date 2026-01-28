package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 성분별 과복용 판단 결과 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientOverdoseResult {
    private Long ingredientId; // 성분 ID
    private String ingredientName; // 성분명
    private Double totalAmount; // 총 섭취량
    private Double maxIntakeValue; // 최대 섭취 기준
    private String unit; // 단위
    private boolean isOverdose; // 과복용 여부
}
