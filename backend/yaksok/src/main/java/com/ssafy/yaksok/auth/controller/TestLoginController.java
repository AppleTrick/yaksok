package com.ssafy.yaksok.auth.controller;

import com.ssafy.yaksok.auth.dto.LoginResponse;
import com.ssafy.yaksok.auth.service.AuthService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.CookieUtil;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** 비밀번호 없이 1번 계정으로 들어가는 시험용 길. 켜지 않으면 주소 자체가 없다. */
@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.test-login-enabled", havingValue = "true")
public class TestLoginController {

    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @GetMapping("/api/v1/auth/test/login")
    public ResponseEntity<ApiResponse<LoginResponse>> testLogin() {
        User user = authService.getTestUser();
        return ResponseUtil.okWithCookies(new LoginResponse(user.getName()),
                cookieUtil.createAccessToken(jwtTokenProvider.createAccessToken(user.getId())));
    }
}
