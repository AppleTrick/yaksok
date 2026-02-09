package com.ssafy.yaksok.global.common.llm.prompt;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 단위 변환 프롬프트 템플릿
 *
 * 비표준 단위를 식약처 표준 단위로 변환합니다.
 */
@Component
public class UnitConversionPrompt implements PromptTemplate {

    private static final String TEMPLATE = """
        당신은 영양학 전문가입니다.
        
        영양 성분의 단위를 식약처 표준 단위로 변환해주세요.
        
        성분명: %s
        현재값: %s %s
        
        변환 규칙:
        1. 식약처 표준 단위: mg, μg, g, mcg
        2. 흡수율, 생체이용률 고려
        3. 정확한 계산
        
        JSON 형식으로만 답변:
        {
          "success": true,
          "amount": 숫자만,
          "unit": "표준 단위"
        }
        
        변환 불가능하면:
        {
          "success": false,
          "error": "이유"
        }
        
        ⚠️ 중요: JSON 형식으로만 응답하세요.
        """;

    @Override
    public String build(Map<String, Object> parameters) {
        validateParameters(parameters);

        String ingredientName = (String) parameters.get("ingredientName");
        String amount = parameters.get("amount").toString();
        String fromUnit = (String) parameters.get("fromUnit");

        return String.format(TEMPLATE, ingredientName, amount, fromUnit);
    }

    @Override
    public String getName() {
        return "UnitConversion";
    }

    @Override
    public String getDescription() {
        return "비표준 단위를 식약처 표준 단위로 변환합니다.";
    }

    @Override
    public String[] getRequiredParameters() {
        return new String[]{"ingredientName", "amount", "fromUnit"};
    }
}