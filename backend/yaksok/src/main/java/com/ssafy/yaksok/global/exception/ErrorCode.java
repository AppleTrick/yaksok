package com.ssafy.yaksok.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // AUTH
    AUTH_UNAUTHORIZED("AUTH_401", "인증이 필요합니다", HttpStatus.UNAUTHORIZED),
    AUTH_LOGIN_FAIL("AUTH_001", "이메일 또는 비밀번호가 올바르지 않습니다", HttpStatus.UNAUTHORIZED),
    AUTH_OAUTH_LOGIN_FAIL("AUTH_001", "카카오 로그인 id가 존재하지 않습니다.", HttpStatus.UNAUTHORIZED),

    // AUTH
    AUTH_TOKEN_INVALID("AUTH_401_1", "유효하지 않은 토큰입니다", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_EXPIRED("AUTH_401_2", "토큰이 만료되었습니다", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_UNSUPPORTED("AUTH_401_3", "지원하지 않는 토큰입니다", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_MALFORMED("AUTH_401_4", "토큰 형식이 올바르지 않습니다", HttpStatus.UNAUTHORIZED),
    AUTH_TOKEN_EMPTY("AUTH_401_5", "토큰이 존재하지 않습니다", HttpStatus.UNAUTHORIZED),

    // USER
    USER_NOT_FOUND("USER_404", "사용자를 찾을 수 없습니다", HttpStatus.NOT_FOUND),
    USER_DUPLICATE_EMAIL("USER_409", "이미 사용 중인 이메일입니다", HttpStatus.CONFLICT),
    USER_DUPLICATE_OUATHID("USER_409", "이미 등록된 회원입니다.", HttpStatus.CONFLICT),

    // COMMON
    INTERNAL_SERVER_ERROR("COMMON_500", "서버 오류가 발생했습니다", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}


