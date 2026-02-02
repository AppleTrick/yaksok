package com.ssafy.yaksok.global.common.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * LLM 제품 추출 응답 DTO
 */
@Data
public class ProductExtractionResponse {

    private String productName;
    private String primaryFunction;
    private String intakeMethod;
    private String precautions;
    private List<IngredientInfo> ingredients = new ArrayList<>();

    /**
     * 성분 정보
     */
    @Data
    public static class IngredientInfo {
        private String name;
        private String amount;  // String으로 받아서 파싱
        private String unit;

        /**
         * amount를 BigDecimal로 변환
         */
        public BigDecimal getAmountAsBigDecimal() {
            try {
                // 콤마 제거 후 파싱
                String cleanAmount = amount.replaceAll(",", "");
                return new BigDecimal(cleanAmount);
            } catch (Exception e) {
                throw new IllegalArgumentException(
                        "잘못된 수량 형식: " + amount, e
                );
            }
        }

        /**
         * 유효한 성분인지 확인
         */
        public boolean isValid() {
            return name != null && !name.trim().isEmpty()
                    && amount != null && !amount.trim().isEmpty()
                    && unit != null && !unit.trim().isEmpty();
        }
    }

    /**
     * 유효한 제품 정보인지 확인
     */
    public boolean isValid() {
        return productName != null && !productName.trim().isEmpty();
    }

    /**
     * 유효한 성분만 필터링
     */
    public List<IngredientInfo> getValidIngredients() {
        return ingredients.stream()
                .filter(IngredientInfo::isValid)
                .toList();
    }
}