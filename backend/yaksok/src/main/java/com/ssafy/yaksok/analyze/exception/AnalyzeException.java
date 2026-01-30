package com.ssafy.yaksok.analyze.exception;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Getter
@Slf4j
public class AnalyzeException extends BusinessException {

    private final String stage;

    public AnalyzeException(ErrorCode errorCode, String stage) {
        super(errorCode);
        this.stage = stage;
    }

    public AnalyzeException(ErrorCode errorCode, String stage, String customMessage) {
        super(errorCode);
        this.stage = stage;
        log.error("[AnalyzeException] Stage: {}, Error: {}, Detail: {}", stage, errorCode.getMessage(), customMessage);
    }

    public AnalyzeException(ErrorCode errorCode, String stage, Throwable cause) {
        super(errorCode);
        this.stage = stage;
    }
}
