package com.ssafy.yaksok.security.contants;

public final class SecurityUrls {
    private SecurityUrls() {
    }

    public static final String[] PUBLIC = {
            "/api/v1/auth",
            "/api/v1/auth/**",
            "/api/v1/analyze",
            "/api/v1/analyze/**",
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/favicon.ico"
    };
}
