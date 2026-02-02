package com.ssafy.yaksok.global.common.llm;

import lombok.Getter;

/**
 * LLM 서비스 예외
 */
@Getter
public class LLMServiceException extends RuntimeException {

    private final String templateName;

    public LLMServiceException(String message, String templateName) {
        super(message);
        this.templateName = templateName;
    }

    public LLMServiceException(String message, String templateName, Throwable cause) {
        super(message, cause);
        this.templateName = templateName;
    }

    @Override
    public String toString() {
        return String.format(
                "LLMServiceException: %s (Template: %s)",
                getMessage(),
                templateName
        );
    }
}