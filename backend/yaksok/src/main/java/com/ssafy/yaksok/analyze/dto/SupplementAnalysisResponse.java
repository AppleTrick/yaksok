package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 영양제 분석 결과 응답 DTO
 * FastAPI 분석 결과를 DB/LLM으로 정제 후 프론트엔드에 반환
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplementAnalysisResponse {

    private ReportData reportData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportData {
        private List<ReportProductInfo> products;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportProductInfo {
        private Long productId;
        private String name;
        private List<Double> box;
        private List<ProductIngredientInfo> ingredients;
        private String intakeTime; // HH:mm:ss 형식 (예: "08:00:00")
        private String intakeCategory; // AFTERMEAL, BEFOREMEAL, BEFORESLEEP
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductIngredientInfo {
        private String name;
        private String amount;
        private String unit;
        private String myAmount; // 유저 현재까지 섭취량
        private String totalAmount; // myAmount + amount
        private String status; // "safe" | "warning"
    }
}