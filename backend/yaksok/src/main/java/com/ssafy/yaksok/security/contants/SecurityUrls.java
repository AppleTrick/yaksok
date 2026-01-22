package com.ssafy.yaksok.security.contants;

public final class SecurityUrls {
    private SecurityUrls() {}

    public static final String[] PUBLIC = {
            "api/v1/auth/**",
            "/swagger-ui/**",
            "/v3/api-docs/**"
    };
}
