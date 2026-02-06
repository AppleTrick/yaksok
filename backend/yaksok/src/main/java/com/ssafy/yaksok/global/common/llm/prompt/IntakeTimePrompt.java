package com.ssafy.yaksok.global.common.llm.prompt;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 영양제 섭취 시간 추천 프롬프트 템플릿
 *
 * 영양제별 권장 섭취 시간과 카테고리를 추천합니다.
 */
@Component
public class IntakeTimePrompt implements PromptTemplate {

    private static final String TEMPLATE = """
            제품명: "%s"

            위 영양제의 권장 섭취 시간을 추천해주세요.

            [카테고리 정의]
            - BEFOREMEAL: 식전 섭취 권장 (공복 흡수가 좋은 성분)
            - AFTERMEAL: 식후 섭취 권장 (지용성 비타민, 위장 자극 성분)
            - BEFORESLEEP: 취침 전 섭취 권장 (마그네슘, 수면 보조 성분)

            [일반적인 권장 사항]
            - 종합비타민: AFTERMEAL (아침 식후)
            - 비타민B군: AFTERMEAL (아침/점심 식후)
            - 오메가3: AFTERMEAL
            - 마그네슘: BEFORESLEEP
            - 철분: BEFOREMEAL
            - 유산균: BEFOREMEAL (공복)

            다음 JSON 형식으로만 응답:
            {
              "intakeTime": "HH:mm:ss 형식 (예: 08:00:00, 5분 단위)",
              "category": "BEFOREMEAL 또는 AFTERMEAL 또는 BEFORESLEEP"
            }

            ⚠️ 중요: JSON만 반환하세요.
            """;

    @Override
    public String build(Map<String, Object> parameters) {
        validateParameters(parameters);

        String productName = (String) parameters.get("productName");

        return String.format(TEMPLATE, productName);
    }

    @Override
    public String getName() {
        return "IntakeTime";
    }

    @Override
    public String getDescription() {
        return "영양제별 권장 섭취 시간을 추천합니다.";
    }

    @Override
    public String[] getRequiredParameters() {
        return new String[] { "productName" };
    }
}
