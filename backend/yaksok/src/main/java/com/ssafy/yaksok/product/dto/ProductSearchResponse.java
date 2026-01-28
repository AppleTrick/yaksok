package com.ssafy.yaksok.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 영양제 검색 결과 응답 DTO
 */
@Getter
@AllArgsConstructor
public class ProductSearchResponse {

    private Long productId;
    private String productName;
}