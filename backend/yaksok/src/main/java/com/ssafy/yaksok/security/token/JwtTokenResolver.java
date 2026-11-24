package com.ssafy.yaksok.security.token;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtTokenResolver {

    private static final String ACCESS_TOKEN_COOKIE = "ACCESS_TOKEN";

    public String resolve(HttpServletRequest request) {
        // 1. 쿠키에서 추출 시도
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            log.debug("쿠키 개수: {}", cookies.length);
            for (Cookie cookie : cookies) {
                if (ACCESS_TOKEN_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        } else {
            log.debug("쿠키가 null입니다.");
        }

        // 주소(쿼리)로는 받지 않는다: 접속 로그와 방문 기록에 토큰이 남는다
        return null;
    }
}
