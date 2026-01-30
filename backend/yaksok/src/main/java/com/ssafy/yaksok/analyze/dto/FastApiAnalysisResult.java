package com.ssafy.yaksok.analyze.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * FastAPI 서버로부터 수신하는 Raw AI 분석 결과 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FastApiAnalysisResult {
    private boolean success;
    private String message;
    private String step;

    /**
     * AI 분석 결과 목록 (객체별 좌표, 바코드, OCR 텍스트)
     */
    @JsonProperty("analysis_results")
    private List<RawAnalysisResult> analysisResults;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RawAnalysisResult {
        private List<Double> box;
        private double confidence;

        @JsonProperty("ocr_texts")
        private List<String> ocrTexts;

        @JsonProperty("ocr_text")
        private String ocrText;

        @JsonProperty("ocr_lines")
        private List<OcrLine> ocrLines;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OcrLine {
        private String text;
        private double confidence;
    }
}
