package com.ssafy.yaksok.global.handler;

import com.ssafy.yaksok.global.dto.ErrorResponse;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.global.util.ResponseUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;
import java.io.IOException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException e) {
        log.error(e.getMessage());
        return ResponseUtil.error(e.getErrorCode());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception e) {
        // SSE 관련 연결 중단 예외는 무시하거나 낮은 레벨로 기록
        if (e instanceof IOException && e.getMessage() != null &&
                (e.getMessage().contains("Broken pipe") || e.getMessage().contains("중단되었습니다"))) {
            log.warn("SSE 클라이언트 연결 중단: {}", e.getMessage());
            return null; // 응답을 보내지 않음 (이미 끊겼으므로)
        }

        // SSE 타임아웃 예외 처리
        if (e instanceof AsyncRequestTimeoutException) {
            return null; // Spring이 기본적으로 처리하도록 둠
        }

        log.error(e.getMessage(), e);
        return ResponseUtil.error(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
