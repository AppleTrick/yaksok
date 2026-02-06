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

            위 제품명이 실제 영양제/건강기능식품 이름인지 판단해주세요.

            [판단 기준]
            1. 한글/영문으로 된 실제 브랜드명 또는 제품명인가?
            2. OCR 오류로 인한 무작위 문자열이 아닌가?
            3. "센트룸", "비타민", "오메가" 등 영양제 관련 단어가 포함되어 있는가?

            [OCR 노이즈 예시 - 무효 처리]
            - "JAB PY HOLA" (무작위 문자)
            - "A1B2C3" (의미없는 조합)
            - "asdf" (무작위 타이핑)

            [유효한 제품명 예시]
            - "센트룸 멀티 구미"
            - "비맥스 메타비"
            - "종근당 비타민C"

            다음 JSON 형식으로만 응답:
            {
              "isValid": true 또는 false,
              "reason": "판단 이유 (한 줄)"
            }

            ⚠️ 확실하지 않으면 isValid: false
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
        return new String[] { "productName" };
    }
}