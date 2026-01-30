package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 영양제 분석 통합 응답 DTO
 * 
 * ResultStep(인식 결과 표시)과 ReportPage(상세 리포트)에 필요한
 * 모든 데이터를 포함하는 통합 객체입니다.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplementAnalysisResponse {
    /**
     * 화면 표시용 데이터 (이미지 위 박스 및 기본 정보)
     */
    private DisplayData displayData;

    /**
     * 상세 리포트 서비스 데이터 (성분 비교, 권장사항 등)
     */
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
    public static class DosageInfo {
        private String name;
        private String min;
        private String recommended;
        private String max;
        private String current;
        private String status; // good, warning
    }
}
