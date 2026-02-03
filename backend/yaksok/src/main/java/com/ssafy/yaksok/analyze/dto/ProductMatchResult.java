package com.ssafy.yaksok.analyze.dto;

import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 제품 매칭 중간 결과 DTO
 * (DB 매칭 정보 + 성분 정보 + OCR 위치 정보)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductMatchResult {

    private Product product;

    private List<Double> box;

    private double confidence;

    private String barcode;

    private boolean exactMatch;

    private List<ProductIngredientResponse> ingredients;
}