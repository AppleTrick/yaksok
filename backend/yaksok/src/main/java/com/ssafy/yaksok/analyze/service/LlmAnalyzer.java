package com.ssafy.yaksok.analyze.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.analyze.dto.internal.AggregatedAnalysisData;
import com.ssafy.yaksok.analyze.dto.internal.AnalysisTarget;
import com.ssafy.yaksok.analyze.dto.response.SupplementAnalysisResponse;
import com.ssafy.yaksok.global.llm.service.LLMService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class LlmAnalyzer {

    private final LLMService llmService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern JSON_PATTERN = Pattern.compile("\\{.*\\}", Pattern.DOTALL);

    /**
     * 취합된 데이터를 바탕으로 LLM 분석을 수행하고 리포트를 생성합니다.
     */
    public SupplementAnalysisResponse.OverdoseAnalysis performLlmAnalysis(AggregatedAnalysisData data) {
        log.info("[LLM_ANALYZER] 상세 분석 시작");

        if (data.getNewTargets().isEmpty() && data.getCurrentSupplements().isEmpty()) {
            return createEmptyOverdoseAnalysis();
        }

        String prompt = buildPrompt(data);

        try {
            String rawResponse = llmService.query(prompt);

            // ═══════════════════════════════════════════════════════════════
            // LLM Raw Response 로깅 (디버깅 및 가시성)
            // ═══════════════════════════════════════════════════════════════
            log.info("[LLM_RAW_RESPONSE] ═══════════════════════════════════════════");
            log.info("{}", rawResponse);
            log.info("═══════════════════════════════════════════════════════════════");

            if (rawResponse == null || rawResponse.isBlank()) {
                log.warn("[LLM_ANALYZER] ⚠️ 응답이 비어있음 - 빈 리포트 반환");
                return createEmptyOverdoseAnalysis();
            }

            String jsonResponse = extractJson(rawResponse);
            log.info("[LLM_ANALYZER] ✅ JSON 추출 완료 ({}자)", jsonResponse.length());

            return objectMapper.readValue(jsonResponse, SupplementAnalysisResponse.OverdoseAnalysis.class);

        } catch (Exception e) {
            log.error("[LLM_ANALYZER] ❌ 분석 또는 파싱 실패 (Fallback 실행): {}", e.getMessage());
            return createEmptyOverdoseAnalysis();
        }
    }

    /**
     * 고도화된 프롬프트 템플릿 (Type A/B 구분 + Chain of Thought + 노이즈 필터링)
     */
    private String buildPrompt(AggregatedAnalysisData data) {
        StringBuilder typeABuilder = new StringBuilder();
        StringBuilder typeBBuilder = new StringBuilder();

        int typeACount = 0, typeBCount = 0;

        // Type A/B 분류
        for (AnalysisTarget t : data.getNewTargets()) {
            if (t.getProduct() != null) {
                // Type A: DB 매칭 성공 (확정 데이터)
                typeABuilder.append("- 제품명: ").append(t.getName())
                        .append("\n  성분: ").append(formatIngredients(t.getIngredients()))
                        .append("\n");
                typeACount++;
            } else {
                // Type B: OCR 원본만 존재 (추론 필요)
                typeBBuilder.append("- OCR 원본: ").append(t.getOcrName())
                        .append("\n");
                typeBCount++;
            }
        }

        log.info("[LLM] 프롬프트 구성 - Type A(확정): {}개, Type B(추론): {}개", typeACount, typeBCount);

        String currentSupplementsInfo = formatCurrentSupplements(data.getCurrentSupplements());

        return """
                [역할] 임상 경험이 풍부한 전문 약사이자 영양사입니다.

                === 데이터 분류 ===

                [Type A - 확정 데이터] (DB 매칭 성공, 성분 정보 포함)
                %s

                [Type B - 추론 필요] (OCR 원본만 존재)
                %s

                [현재 복용 중]
                %s

                === 중요 지침 ===

                ⚠️ 노이즈 필터링:
                - HALE, YaD, 608, H1 등 의미없는 영문/숫자 조합은 즉시 무시
                - 분석 대상이 아닌 텍스트는 언급하지 마세요

                📋 분석 원칙:
                1. Type A는 확정 정보로 바로 분석
                2. Type B는 오타 가능성 감안하여 가장 유사한 실제 제품 추론
                3. 추론 불가능한 Type B는 건너뛰기

                📝 응답 원칙:
                - 핵심 위주 간결한 분석
                - 과복용/상호작용 위험 시에만 warning
                - 불필요한 설명 생략

                === JSON 출력 (순수 JSON만) ===
                {
                  "comparison": [ { "name": "성분명", "myAmount": "0mg", "newAmount": "10mg", "totalAmount": "10mg", "status": "good|warning|new" } ],
                  "recommendations": {
                    "interactions": [ { "type": "tip|warning", "text": "내용" } ],
                    "timingGuides": [ { "time": "아침|저녁", "products": ["제품명"], "reason": "이유" } ],
                    "dosageInfo": [ { "name": "성분명", "min": "최소", "recommended": "권장", "max": "최대", "current": "현재", "status": "good|warning" } ],
                    "productNotes": [ "핵심 복용 팁만" ]
                  }
                }
                """
                .formatted(
                        typeABuilder.length() > 0 ? typeABuilder.toString() : "없음",
                        typeBBuilder.length() > 0 ? typeBBuilder.toString() : "없음",
                        currentSupplementsInfo.isBlank() ? "없음" : currentSupplementsInfo);
    }

    // 신규 영양제 포맷팅은 buildPrompt 내부에서 Type A/B 분류로 대체됨
    /*
     * private String formatNewSupplements(List<AnalysisTarget> targets) {
     * return targets.stream()
     * .map(t -> "- 제품명: %s\n  성분: %s".formatted(t.getName(),
     * formatIngredients(t.getIngredients())))
     * .collect(Collectors.joining("\n"));
     * }
     */

    /**
     * 현재 영양제 정보 포맷팅
     */
    private String formatCurrentSupplements(List<com.ssafy.yaksok.product.dto.UserProductResponse> current) {
        return current.stream()
                .map(s -> "- 제품명: %s\n  성분: %s".formatted(s.getProductName(),
                        s.getIngredients().stream()
                                .map(i -> "%s(%s%s)".formatted(i.name(), i.amount(), i.unit()))
                                .collect(Collectors.joining(", "))))
                .collect(Collectors.joining("\n"));
    }

    /**
     * 성분 리스트 문자열 변환
     */
    private String formatIngredients(List<SupplementAnalysisResponse.ProductIngredientInfo> ingredients) {
        if (ingredients == null || ingredients.isEmpty())
            return "정보 없음";
        return ingredients.stream()
                .map(i -> "%s(%s%s)".formatted(i.getName(), i.getAmount(), i.getUnit()))
                .collect(Collectors.joining(", "));
    }

    /**
     * 응답 본문에서 JSON 블록만 추출
     */
    private String extractJson(String raw) {
        Matcher matcher = JSON_PATTERN.matcher(raw);
        if (matcher.find()) {
            return matcher.group();
        }
        return raw;
    }

    private SupplementAnalysisResponse.OverdoseAnalysis createEmptyOverdoseAnalysis() {
        return SupplementAnalysisResponse.OverdoseAnalysis.builder()
                .comparison(new ArrayList<>())
                .recommendations(SupplementAnalysisResponse.Recommendations.builder()
                        .interactions(new ArrayList<>())
                        .dosageInfo(new ArrayList<>())
                        .timingGuides(new ArrayList<>())
                        .productNotes(new ArrayList<>())
                        .build())
                .build();
    }
}
