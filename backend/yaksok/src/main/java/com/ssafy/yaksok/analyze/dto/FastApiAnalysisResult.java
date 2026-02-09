package com.ssafy.yaksok.analyze.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * FastAPI 서버로부터 수신하는 Raw AI 분석 결과 DTO
 */
@Data
public class FastApiAnalysisResult {
    private boolean success;
    private String message;
    private String step;
    
    /**
     * AI 분석 결과 목록 (객체별 좌표, 제품명, OCR 텍스트, 바코드)
     */
    @JsonProperty("analysis_results")
    private List<RawAnalysisResult> analysisResults;

    /**
     * 개별 객체 분석 결과
     */
    @Data
    public static class RawAnalysisResult {

        /**
         * 탐지된 객체의 좌표 [x1, y1, x2, y2]
         * 정규화된 좌표 (0.0 ~ 1.0)
         */
        private List<Double> box;

        /**
         * 탐지 신뢰도 (0.0 ~ 1.0)
         */
        private double confidence;

        /**
         * Vision API가 추출한 제품명
         * OCR 텍스트 중 가장 중요한 제품명 부분
         */
        @JsonProperty("product_name")
        private String productName;

        /**
         * OCR로 추출된 전체 텍스트
         * 여러 줄의 텍스트가 \n으로 구분되어 있음
         */
        @JsonProperty("ocr_text")
        private String ocrText;

        /**
         * 바코드 데이터 (인식된 경우에만 존재)
         * null 또는 빈 문자열일 수 있음
         */
        private String barcode;
    }
}
