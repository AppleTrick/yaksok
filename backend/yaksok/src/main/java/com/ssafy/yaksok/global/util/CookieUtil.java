package com.ssafy.yaksok.global.util;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    private final boolean secure;

    public CookieUtil(@Value("${cookie.secure}") boolean secure) {
        this.secure = secure;
    }

    private static final String ACCESS_TOKEN = "ACCESS_TOKEN";
    private static final String REFRESH_TOKEN = "REFRESH_TOKEN";

    //쿠키 만들기

    public ResponseCookie createAccessToken(String token) {
        return ResponseCookie.from(ACCESS_TOKEN, token)
                .httpOnly(true)
                .secure(secure)      //환경별 적용
                .path("/")
                .maxAge(60 * 60)
                .sameSite("None")
                .build();
    }

    public ResponseCookie createRefreshToken(String token) {
        return ResponseCookie.from(REFRESH_TOKEN, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(60 * 60 * 24 * 7)
                .sameSite("None")
                .build();
    }

    //쿠키 지우기

    public ResponseCookie deleteAccessToken() {
        return ResponseCookie.from(ACCESS_TOKEN, "")
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
    }

    public ResponseCookie deleteRefreshToken() {
        return ResponseCookie.from(REFRESH_TOKEN, "")
                .secure(secure)
                .path("/")
                .maxAge(0)
                .sameSite("None")
                .build();
    }
}
