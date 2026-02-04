package com.ssafy.yaksok.global.common.llm.prompt;

import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 제품 정보 추출 프롬프트 (Label Focused Mode)
 * 전체 성분이 아닌, 실제 제품 라벨에 표기된 '핵심 성분' 위주로 추출하도록 조정됨.
 */
@Component
public class ProductExtractionPrompt implements PromptTemplate {

    private static final String TEMPLATE = """
        [Role]
        당신은 한국 식약처 기준에 맞춘 '건강기능식품 라벨 분석가'입니다.
        백과사전식 정보보다는, **실제 제품 패키지 뒷면의 [영양·기능정보] 표에 적힌 내용**을 우선시합니다.
        
        [Target Product]
        제품명: "%s"
        
        [Task]
        위 제품의 **라벨에 표기된 핵심 영양 성분**과 정보를 JSON으로 작성하세요.
        
        [Rules for Label Matching (라벨 일치 수칙)]
        1. **라벨 기준**: 미국판 풀 스펙트럼(Full Spectrum) 정보가 아닌, **한국 유통 제품의 표준 라벨**에 표기된 성분 위주로 작성하세요.
        2. **핵심 성분 집중**: 비타민(A, C, D, E, B군), 아연, 마그네슘 등 **주요 기능성 원료** 8~12개 내외로 추리세요.
        3. **미량 성분 제외**: 요오드, 크롬, 몰리브덴, 셀레늄, 망간 등은 해당 제품의 '주요 기능성'으로 강조된 경우가 아니라면 과감히 제외하세요.
        4. **함량 정확도**: 가능한 한 해당 제품의 **1일 섭취량 기준 함량**을 적으세요.
        
        [Response Format (JSON Only)]
        {
          "productName": "제품명 (한국어 표준)",
          "primaryFunction": "식약처 인정 주된 기능성 (예: 정상적인 면역기능, 항산화)",
          "intakeMethod": "1일 섭취량 및 방법 (예: 1일 1회, 2구미 씹어서 섭취)",
          "precautions": "섭취 시 주의사항 (핵심만)",
          "ingredients": [
            {
              "name": "성분명 (한글)",
              "amount": "숫자만 (예: 500)",
              "unit": "단위 (mg, μg, g, IU)"
            }
          ]
        }
        
        **작성 예시 (센트룸 멀티 구미의 경우):**
        - 포함: 비타민A, D, E, B6, B12, 나이아신, 비오틴, 아연, 요오드(주성분일 경우만)
        - 제외: 부원료, 인공색소, 극미량 미네랄
        
        오직 JSON 데이터만 반환하세요.
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
    public String[] getRequiredParameters() {
        return new String[]{"productName"};
    }
}