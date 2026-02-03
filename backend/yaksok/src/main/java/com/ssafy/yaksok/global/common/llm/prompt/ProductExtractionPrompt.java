package com.ssafy.yaksok.global.common.llm.prompt;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 제품 정보 추출 프롬프트 템플릿
 *
 * LLM을 사용하여 제품명으로부터 상세 정보와 성분을 추출합니다.
 */
@Component
public class ProductExtractionPrompt implements PromptTemplate {

    private static final String TEMPLATE = """
        당신은 영양제 전문가입니다.
        
        제품명: "%s"
        
        이 제품에 대한 정보를 웹 검색을 통해 확인하고 다음 JSON 형식으로 제공해주세요:
        {
          "productName": "정확한 제품명",
          "primaryFunction": "주요 기능 (예: 면역력 증진)",
          "intakeMethod": "섭취 방법 (예: 1일 1회, 1회 1정)",
          "precautions": "주의사항 (예: 임산부 섭취 금지)",
          "ingredients": [
            {
              "name": "성분명",
              "amount": "숫자만",
              "unit": "단위 (mg, μg, g, IU 등)"
            }
          ]
        }
        
        규칙:
        1. 반드시 웹 검색으로 확인한 정보만 제공
        2. 추측하거나 임의로 생성하지 말 것
        3. 모든 필드는 한국어로 작성
        4. 정보를 찾을 수 없는 필드는 "정보 없음"으로 표시
        5. ingredients는 주요 성분 위주로 작성 (5~10개 정도)
        6. amount는 순수 숫자만 (예: "1000", "25")
        7. unit은 표준 단위 사용 (mg, μg, g, IU, mcg)
        
        ⚠️ 중요: 반드시 JSON 형식으로만 응답하세요. 설명이나 부가 텍스트를 추가하지 마세요.
        """;

    @Override
    public String build(Map<String, Object> parameters) {
        validateParameters(parameters);

        String productName = (String) parameters.get("productName");

        return String.format(TEMPLATE, productName);
    }

    @Override
    public String getName() {
        return "ProductExtraction";
    }

    @Override
    public String getDescription() {
        return "제품명으로부터 제품 정보와 성분 목록을 추출합니다.";
    }

    @Override
    public String[] getRequiredParameters() {
        return new String[]{"productName"};
    }
}