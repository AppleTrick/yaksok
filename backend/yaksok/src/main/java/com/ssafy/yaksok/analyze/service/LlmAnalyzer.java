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
            String rawResponse = llmService.query(prompt, 0.3);
            if (rawResponse == null || rawResponse.isBlank()) {
                log.warn("[LLM_ANALYZER] 응답이 비어있음 - 빈 리포트 반환");
                return createEmptyOverdoseAnalysis();
            }

            String jsonResponse = extractJson(rawResponse);
            log.info("[LLM_ANALYZER] 분석 결과 파싱 시도");

            return objectMapper.readValue(jsonResponse, SupplementAnalysisResponse.OverdoseAnalysis.class);

        } catch (Exception e) {
            log.error("[LLM_ANALYZER] 분석 또는 파싱 실패 (Fallback 실행): {}", e.getMessage());
            return createEmptyOverdoseAnalysis();
        }
    }

    /**
     * 고도화된 프롬프트 템플릿을 빌드합니다. (Java 17 Text Blocks)
     */
    private String buildPrompt(AggregatedAnalysisData data) {
        String newSupplementsInfo = formatNewSupplements(data.getNewTargets());
        String currentSupplementsInfo = formatCurrentSupplements(data.getCurrentSupplements());

        return """
                당신은 임상 경험이 풍부한 전문 약사이자 영양사입니다.
                제시된 영양제 섭취 정보를 바탕으로 다음 지침에 따라 전문적인 분석 리포트를 작성하세요.

                [지침]
                1. comparison: 각 성분별 일일 권장량을 기준으로 현재 복용량과 신규 추가량을 합산하여 과복용 여부를 정밀 분석하세요.
                2. interactions: 제품 간 흡수 방해(예: 칼슘과 철분의 경쟁 흡수)나 부작용, 시너지 효과를 약학적 관점에서 분석하세요.
                3. timingGuides: 각 제품의 성분 특성(지용성 비타민의 식후 복용, 위장 장애 예방 등)을 고려하여 아침/점심/저녁/취침전 중 최적의 시간과 이유를 명시하세요.
                4. dosageInfo: 주요 성분별 일일 최소/권장/최대 섭취량 대비 현재 상태를 status(good, warning)로 표시하세요.

                [새로 분석된 영양제]
                %s

                [현재 복용 중인 영양제]
                %s

                [JSON 출력 요구사항]
                인사말이나 부연 설명 없이, 반드시 아래 스키마를 따르는 순수 JSON 블록만 출력하세요.
                {
                  "comparison": [ { "name": "성분명", "myAmount": "0mg", "newAmount": "10mg", "totalAmount": "10mg", "status": "good|warning|new" } ],
                  "recommendations": {
                    "interactions": [ { "type": "tip|warning", "text": "내용" } ],
                    "timingGuides": [ { "time": "아침", "products": ["제품명"], "reason": "이유(식전/식후 구분 포함)" } ],
                    "dosageInfo": [ { "name": "성분명", "min": "최소", "recommended": "권장", "max": "최대", "current": "현재", "status": "good|warning" } ],
                    "productNotes": [ "제품별 시각적 특이사항이나 복용 팁" ]
                  }
                }
                """
                .formatted(newSupplementsInfo, currentSupplementsInfo);
    }

    /**
     * 신규 영양제 정보 포맷팅
     */
    private String formatNewSupplements(List<AnalysisTarget> targets) {
        return targets.stream()
                .map(t -> "- 제품명: %s\n  성분: %s".formatted(t.getName(), formatIngredients(t.getIngredients())))
                .collect(Collectors.joining("\n"));
    }

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
