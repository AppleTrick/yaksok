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
        log.error(e.getMessage());
        return ResponseUtil.error(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
