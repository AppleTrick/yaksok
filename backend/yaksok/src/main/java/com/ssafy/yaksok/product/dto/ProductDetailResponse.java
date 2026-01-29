package com.ssafy.yaksok.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

/**
 * 영양제 상세 정보 응답 DTO
 */
@Getter
@AllArgsConstructor
public class ProductDetailResponse {

    private Long productId;
    private String productName;
    private String primaryFunction;     // 주요 기능
    private String intakeMethod;        // 섭취 방법
    private String precautions;         // 주의사항
    private List<ProductIngredientResponse> ingredients;  // 성분 목록
}