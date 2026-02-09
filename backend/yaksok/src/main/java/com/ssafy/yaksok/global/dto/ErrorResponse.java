package com.ssafy.yaksok.global.dto;

import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ErrorResponse {

    private boolean success;
    private ErrorDetail error;

    public static ErrorResponse of(ErrorCode errorCode) {
        return new ErrorResponse(
                false,
                new ErrorDetail(
                        errorCode.getCode(),
                        errorCode.getMessage()
                )
        );
    }

    @Getter
    @AllArgsConstructor
    static class ErrorDetail {
        private String code;
        private String message;
    }
}


