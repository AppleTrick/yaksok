package com.ssafy.yaksok.security.contants;

public final class SecurityUrls {
    private SecurityUrls() {}

    public static final String[] PUBLIC = {
            "/auth/**",
            "/swagger-ui/**",
            "/v3/api-docs/**"
    };
}
