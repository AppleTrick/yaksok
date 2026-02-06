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

            [판단 기준]
            1. [브랜드명] + [성분/기능] 조합인가? (예: "필리 비타민C", "종근당 마그네슘", "pilly 칼슘")
            2. 널리 알려진 브랜드(종근당, 센트룸 등)나 건강기능식품 전문 브랜드(필리, 핏타민, 덴프스 등)인가?
            3. OCR 노이즈(의미 없는 문자 나열)가 아닌 명확한 단어의 조합인가?
            4. 건강기능식품 마크가 있는 제품에서 흔히 볼 수 있는 성분명(비타민, 루테인, 유산균 등)이 포함되었는가?

            [유효한 제품 예시 - isValid: true]
            - "필리 비타민C" (브랜드+성분)
            - "pilly 칼슘 마그네슘" (영문 브랜드+성분)
            - "비맥스 메타비" (제품 라인업 명칭)
            - "센트룸 멀티 구미" (글로벌 브랜드+제품타입)
            [OCR 노이즈 예시 - isValid: false]
            - "JAB PY HOLA", "A1B2C3", "xxyyzz" (무작위 문자열)
            - "유통기한 2025" (제품명이 아닌 정보성 텍스트)
            - "섭취 시 주의사항" (제품명이 아닌 안내 텍스트)

            다음 JSON 형식으로만 응답:
            {
              "isValid": true 또는 false,
              "reason": "판단 이유 (한 줄)"
            }

            ⚠️ 브랜드명이 포함되어 있고 성분명이 명확하다면 실제 제품일 확률이 높으므로 true로 판단하세요.
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