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
              [Target Product]
      제품명: "%s"

      [Task]
      위 제품의 **주요 영양 성분** 정보를 JSON으로 작성하세요.

      [Important Instructions]
      1. **반드시 성분 정보를 제공하세요**: 해당 제품에 대한 공식 정보가 없더라도,
         일반적으로 알려진 해당 종류의 영양제 성분 정보를 기반으로 작성하세요.
      2. **추정 허용**: "비맥스"는 비타민B군 복합제, "센트룸"은 종합비타민으로 널리 알려져 있습니다.
         이러한 일반적인 지식을 활용하여 성분을 추정해도 됩니다.
      3. **핵심 성분 5~12개**: 해당 제품 유형에 일반적으로 포함되는 주요 성분을 작성하세요.
      4. **빈 배열 금지**: ingredients 배열이 비어있으면 안 됩니다.
         최소한 해당 제품 유형의 대표 성분이라도 포함하세요.
      5. **성분명 표준화 필수**: 아래 [표준 성분명 규칙]을 반드시 준수하세요.
      6. **권장섭취량/상한섭취량 포함**: 한국 식약처 기준을 참고하여 작성하세요.

      [표준 성분명 규칙 - 반드시 아래 형식 사용]
      - 비타민 B군: "비타민 B1", "비타민 B2", "비타민 B3", "비타민 B5", "비타민 B6", "비타민 B7", "비타민 B9", "비타민 B12"
        (티아민, 리보플라빈, 나이아신 등의 화학명 대신 위 형식 사용)
      - 기타 비타민: "비타민 A", "비타민 C", "비타민 D", "비타민 E", "비타민 K"
      - 미네랄: "칼슘", "마그네슘", "아연", "철분", "셀레늄", "구리", "망간", "크롬", "요오드"
      - 오메가: "EPA", "DHA", "오메가-3"
      - 눈 건강: "루테인", "지아잔틴"
      - 기타: "코엔자임 Q10", "프로바이오틱스", "콜라겐", "글루코사민"

      [Well-known Product Guidelines]
      - 비맥스/비타민B 제품류: 비타민 B1, 비타민 B2, 비타민 B6, 비타민 B12, 비타민 B3, 비타민 B5, 비타민 B9, 비타민 B7 등
      - 센트룸/종합비타민류: 비타민 A, 비타민 C, 비타민 D, 비타민 E, 비타민 B군, 아연, 마그네슘, 칼슘 등
      - 오메가3 제품류: EPA, DHA
      - 루테인 제품류: 루테인, 지아잔틴

      [Response Format (JSON Only)]
      {
        "productName": "제품명",
        "primaryFunction": "주요 기능성 (예: 피로회복, 면역력 강화)",
        "intakeMethod": "1일 섭취량 및 방법",
        "precautions": "섭취 시 주의사항",
        "ingredients": [
          {
            "name": "성분명 (위 표준 형식 사용)",
            "amount": "숫자만 (예: 500)",
            "unit": "단위 (mg, μg, g, IU)",
            "recommendedIntake": "한국 식약처 기준 권장섭취량 숫자 (예: 1.2)",
            "upperLimit": "한국 식약처 기준 상한섭취량 숫자 (예: 100, 상한 없으면 null)"
          }
        ]
      }

      **중요**:
      - ingredients 배열에 최소 5개 이상의 성분을 반드시 포함하세요!
      - 성분명은 반드시 [표준 성분명 규칙]을 따르세요!
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
    return new String[] { "productName" };
  }
}