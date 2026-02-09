package com.ssafy.yaksok.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 제품 성분 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductIngredientResponse {

    private Long productId; // 제품 ID (Batch fetching용)

    private Long ingredientId; // 성분 ID

    private String name; // 성분명

    private BigDecimal amount; // 함량

    private String unit; // 단위

    private Integer dailyPercent; // 일일 권장량 대비 비율 (%)
}