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

        // 2. 쿼리 파라미터에서 추출 시도 (SSE 등 쿠키 전송이 제한적인 경우 대비)
        String token = request.getParameter("token");
        if (token != null && !token.isEmpty()) {
            return token;
        }

        return null;
    }
}
