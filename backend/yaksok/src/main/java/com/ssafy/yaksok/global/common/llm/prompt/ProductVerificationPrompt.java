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

            위 제품명이 실제 영양제/건강기능식품 제품명인지 판단해주세요.
            특히 "필리(pilly)"는 대한민국에서 매우 유명한 영양제 정기구독 브랜드이므로 반드시 유효한 브랜드로 판단해야 합니다.

            [판단 기준 - 핵심]
            1. [브랜드] + [성분명] 조합인가? (가장 높은 우선순위)
               - 예: "필리 비타민C", "종근당 마그네슘", "덴프스 유산균"
            2. 성분명(비타민, 칼슘, 루테인, 오메가 등)이 포함되어 있는가?
            3. OCR 노이즈(의미 없는 나열)가 아닌 읽을 수 있는 단어의 조합인가?

            [유효한 브랜드 (반드시 TRUE)]
            - 필리(pilly), 핏타민, 덴프스, 뉴트리원, 고려은단, 종근당, 대웅제약, 센트룸 등

            [유효한 제품 예시 - isValid: true]
            - "필리 칼슘 마그네슘 비타민 D" (브랜드 + 복합성분)
            - "필리 비타민C" (브랜드 + 단일성분)
            - "비맥스 메타비" (제품명)
            - "pilly Vitamin" (영문 브랜드 + 성분)

            [OCR 노이즈 예시 - isValid: false]
            - "JAB PY HOLA", "A1B2C3" (무작위 문자열)
            - "섭취 시 주의사항", "유통기한" (정보성 텍스트)

            다음 JSON 형식으로만 응답:
            {
              "isValid": true 또는 false,
              "reason": "판단 이유 (한 줄)"
            }

            ⚠️ "필리" 또는 "pilly"가 포함되어 있고 뒤에 영양소 이름이 나온다면 고민하지 말고 true로 답변하세요.
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