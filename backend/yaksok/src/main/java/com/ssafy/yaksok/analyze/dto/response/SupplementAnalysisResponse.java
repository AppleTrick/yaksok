package com.ssafy.yaksok.analyze.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 영양제 분석 통합 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplementAnalysisResponse {
    private DisplayData displayData;
    private ReportData reportData;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DisplayData {
        private int objectCount;
        private List<ProductDisplayInfo> products;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductDisplayInfo {
        private Long tempId;
        private String name;
        private double confidence;
        private List<Double> box;
        private boolean isExactMatch;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportData {
        private List<ReportProductInfo> products;
        private OverdoseAnalysis overdoseAnalysis;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportProductInfo {
        private Long productId;
        private String name;
        private double confidence;
        private List<ProductIngredientInfo> ingredients;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductIngredientInfo {
        private String name;
        private String amount;
        private String unit;
        private int dailyPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverdoseAnalysis {
        private List<DetectedProduct> detectedProducts; // LLM 추론 제품명 (UI 표시용)
        private List<ComparisonResult> comparison;
        private Recommendations recommendations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComparisonResult {
        private String name;
        private String myAmount;
        private String newAmount;
        private String totalAmount;
        private String status; // good, warning, new
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recommendations {
        private List<InteractionInfo> interactions;
        private List<DosageInfo> dosageInfo;
        private List<TimingGuide> timingGuides;
        private List<String> productNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InteractionInfo {
        private String type; // tip, warning
        private String text;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimingGuide {
        private String time;
        private List<String> products;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DosageInfo {
        private String name;
        private String min;
        private String recommended;
        private String max;
        private String current;
        private String status;
    }

    /**
     * LLM이 추론한 제품명 정보 (Type B 보정용)
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DetectedProduct {
        private String ocrHint; // 원본 OCR 힌트 (예: "가능품 (추정)")
        private String inferredName; // LLM 추론 제품명 (예: "센트롱")
    }
}
