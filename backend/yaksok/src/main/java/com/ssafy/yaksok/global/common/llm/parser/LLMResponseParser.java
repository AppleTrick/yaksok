package com.ssafy.yaksok.global.common.llm.parser;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * LLM 응답 파싱 유틸리티
 *
 * LLM의 텍스트 응답을 JSON으로 파싱하고 객체로 변환합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LLMResponseParser {

    private final ObjectMapper objectMapper;

    /**
     * LLM 응답을 객체로 파싱
     *
     * @param rawResponse LLM의 원본 응답
     * @param targetType 변환할 타입
     * @return 파싱된 객체
     */
    public <T> T parse(String rawResponse, Class<T> targetType) {
        log.debug("LLM 응답 파싱 시작: targetType={}", targetType.getSimpleName());

        // 1. JSON 추출 (```json ... ``` 제거)
        String cleanJson = extractJson(rawResponse);
        log.debug("정제된 JSON: {}", cleanJson);

        // 2. JSON 파싱
        T result;
        try {
            result = objectMapper.readValue(cleanJson, targetType);
        } catch (JsonProcessingException e) {
            log.error("JSON 파싱 실패: {}", cleanJson);
            throw new LLMResponseParseException(
                    "JSON 파싱 실패: " + e.getMessage(),
                    cleanJson,
                    e
            );
        }

        log.debug("LLM 응답 파싱 완료: {}", result);
        return result;
    }

    /**
     * JSON 문자열 추출 및 정제
     *
     * LLM이 ```json ... ``` 형태로 응답하는 경우 처리
     */
    private String extractJson(String rawResponse) {
        if (rawResponse == null || rawResponse.isEmpty()) {
            throw new LLMResponseParseException("LLM 응답이 비어있습니다.", rawResponse);
        }

        // Markdown 코드 블록 제거
        String cleaned = rawResponse
                .replaceAll("```json\\s*", "")
                .replaceAll("```\\s*", "")
                .trim();

        // JSON 시작/끝 확인
        if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
            log.warn("유효하지 않은 JSON 형식: {}", cleaned.substring(0, Math.min(100, cleaned.length())));

            // JSON 부분만 추출 시도
            int startIndex = cleaned.indexOf("{");
            int endIndex = cleaned.lastIndexOf("}");

            if (startIndex != -1 && endIndex != -1 && startIndex < endIndex) {
                cleaned = cleaned.substring(startIndex, endIndex + 1);
                log.info("JSON 추출 성공: {}", cleaned.substring(0, Math.min(50, cleaned.length())));
            } else {
                throw new LLMResponseParseException(
                        "JSON을 찾을 수 없습니다.",
                        rawResponse
                );
            }
        }

        return cleaned;
    }

    /**
     * 안전한 파싱 (예외 발생 시 null 반환)
     */
    public <T> T parseSafe(String rawResponse, Class<T> targetType) {
        try {
            return parse(rawResponse, targetType);
        } catch (Exception e) {
            log.error("LLM 응답 파싱 실패 (null 반환): {}", e.getMessage());
            return null;
        }
    }

    /**
     * JSON 검증
     */
    public boolean isValidJson(String jsonString) {
        try {
            objectMapper.readTree(jsonString);
            return true;
        } catch (JsonProcessingException e) {
            return false;
        }
    }
}