package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

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
        private String barcode;
        private double confidence;

        // [수정] 프론트엔드에서 box를 참조하므로 이름을 변경 (boundingBox -> box)
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
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Recommendations {
        private List<InteractionInfo> interactions;
        private List<DosageInfo> dosageInfo;
        private List<String> productNotes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InteractionInfo {
        private String type;
        private String text;
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
}