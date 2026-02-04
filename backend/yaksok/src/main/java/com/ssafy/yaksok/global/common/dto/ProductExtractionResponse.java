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
        private String amount;
        private String unit;

        /**
         * amount를 BigDecimal로 변환
         */
        public BigDecimal getAmountAsBigDecimal() {
            // 1. 값이 없거나 "정보 없음" 같은 텍스트인 경우 0 반환
            if (amount == null || amount.trim().isEmpty() ||
                    amount.contains("정보") || amount.contains("없음") || amount.contains("미상")) {
                return BigDecimal.ZERO;
            }

            try {
                // 2. 숫자와 소수점(.)을 제외한 모든 문자(한글, 영어, 콤마 등) 제거
                // 예: "약 1,000mg" -> "1000"
                String cleanAmount = amount.replaceAll("[^0-9.]", "");

                if (cleanAmount.isEmpty()) {
                    return BigDecimal.ZERO;
                }

                return new BigDecimal(cleanAmount);
            } catch (Exception e) {
                // 3. 그래도 파싱 못하면 에러 내지 말고 그냥 0 반환
                return BigDecimal.ZERO;
            }
        }

        /**
         * 유효한 성분인지 확인
         */
        public boolean isValid() {
            return name != null && !name.trim().isEmpty();
        }
    }

    /**
     * 유효한 제품 정보인지 확인
     */
    public boolean isValid() {
        return productName != null && !productName.trim().isEmpty();
    }

    public List<IngredientInfo> getValidIngredients() {
        return ingredients;
    }
}