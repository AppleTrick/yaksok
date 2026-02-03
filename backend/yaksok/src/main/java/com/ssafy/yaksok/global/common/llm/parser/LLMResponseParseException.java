package com.ssafy.yaksok.global.common.llm.parser;

import lombok.Getter;

/**
 * LLM 응답 파싱 실패 예외
 */
@Getter
public class LLMResponseParseException extends RuntimeException {

    private final String rawResponse;

    public LLMResponseParseException(String message, String rawResponse) {
        super(message);
        this.rawResponse = rawResponse;
    }

    public LLMResponseParseException(String message, String rawResponse, Throwable cause) {
        super(message, cause);
        this.rawResponse = rawResponse;
    }

    @Override
    public String toString() {
        return String.format(
                "LLMResponseParseException: %s\nRaw Response: %s",
                getMessage(),
                rawResponse != null && rawResponse.length() > 200
                        ? rawResponse.substring(0, 200) + "..."
                        : rawResponse
        );
    }
}