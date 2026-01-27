package com.ssafy.yaksok.ingredient.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.global.llm.service.LLMService;
import com.ssafy.yaksok.ingredient.dto.UnitConversionResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * LLM 기반 영양 성분 단위 변환 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IngredientUnitConversionService {

    private final LLMService llmService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * LLM으로 비표준 단위 변환
     *
     * @param ingredientName 성분명
     * @param amount 수량
     * @param fromUnit 현재 단위
     * @return 변환 결과
     */
    public UnitConversionResultDto convertUnit(
            String ingredientName,
            BigDecimal amount,
            String fromUnit
    ) {
        log.info("LLM 단위 변환 요청: {} {} {}", ingredientName, amount, fromUnit);

        try {
            // 프롬프트 생성
            String prompt = buildConversionPrompt(ingredientName, amount, fromUnit);

            // LLM 호출
            String response = llmService.query(prompt, 0.1);

            // 응답 파싱
            UnitConversionResultDto result = parseResponse(response);

            if (result.isSuccess()) {
                log.info("LLM 변환 성공: {} {} → {} {}",
                        amount, fromUnit, result.getAmount(), result.getUnit());
            } else {
                log.warn("LLM 변환 실패: {}", result.getError());
            }

            return result;

        } catch (Exception e) {
            log.error("LLM 단위 변환 실패: {}", e.getMessage());
            return UnitConversionResultDto.failed("변환 중 오류 발생: " + e.getMessage());
        }
    }

    /**
     * 단위 변환 프롬프트 생성
     */
    private String buildConversionPrompt(
            String ingredientName,
            BigDecimal amount,
            String fromUnit
    ) {
        return String.format("""
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
            """, ingredientName, amount, fromUnit);
    }

    /**
     * LLM 응답 파싱
     */
    private UnitConversionResultDto parseResponse(String response) {
        try {
            String json = response.replaceAll("```json|```", "").trim();
            JsonNode node = objectMapper.readTree(json);

            if (node.path("success").asBoolean()) {
                BigDecimal amount = new BigDecimal(node.path("amount").asText());
                String unit = node.path("unit").asText();
                return UnitConversionResultDto.success(amount, unit);
            } else {
                String error = node.path("error").asText("알 수 없는 오류");
                return UnitConversionResultDto.failed(error);
            }

        } catch (Exception e) {
            log.error("LLM 응답 파싱 실패: {}", e.getMessage());
            return UnitConversionResultDto.failed("응답 파싱 실패");
        }
    }
}