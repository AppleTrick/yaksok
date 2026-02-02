package com.ssafy.yaksok.global.common.llm.prompt;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 제품 존재 여부 검증 프롬프트 템플릿
 *
 * 제품이 실제로 존재하는지 웹 검색으로 확인합니다.
 */
@Component
public class ProductVerificationPrompt implements PromptTemplate {

    private static final String TEMPLATE = """
        제품명: "%s"
        
        이 제품이 실제로 판매되는 영양제/건강기능식품인지 웹 검색으로 확인해주세요.
        
        다음 JSON 형식으로만 응답해주세요:
        {
          "exists": true 또는 false,
          "confidence": "high" 또는 "medium" 또는 "low",
          "source": "확인한 출처 URL (존재하는 경우)"
        }
        
        규칙:
        1. 반드시 웹 검색으로 확인
        2. 확실하지 않으면 exists: false 반환
        3. confidence가 high인 경우만 exists: true
        4. 공식 판매처나 제조사 사이트를 우선 참고
        
        ⚠️ 중요: JSON 형식으로만 응답하세요.
        """;

    @Override
    public String build(Map<String, Object> parameters) {
        validateParameters(parameters);

        String productName = (String) parameters.get("productName");

        return String.format(TEMPLATE, productName);
    }

    @Override
    public String getName() {
        return "ProductVerification";
    }

    @Override
    public String getDescription() {
        return "제품이 실제로 존재하는지 검증합니다.";
    }

    @Override
    public String[] getRequiredParameters() {
        return new String[]{"productName"};
    }
}