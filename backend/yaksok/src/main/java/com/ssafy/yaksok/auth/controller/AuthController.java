package com.ssafy.yaksok.auth.controller;

import com.ssafy.yaksok.auth.client.KakaoOAuthClient;
import com.ssafy.yaksok.auth.dto.*;
import com.ssafy.yaksok.auth.service.AuthService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.CookieUtil;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KakaoOAuthClient kakaoOAuthClient;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    // 회원가입
    @PostMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(
            @RequestBody SignupRequest request
    ) {

        authService.signUp(request);
        return ResponseUtil.ok();
    }

    // 카카오 회원가입
    @PostMapping("/oauth/signup")
    public ResponseEntity<ApiResponse<Void>> oauthSignup(
            @RequestBody KakaoRequest request
    ) {
        KakaoUserInfo userInfo =
                kakaoOAuthClient.getUserInfo(request.getAccessToken());

        authService.KaKaoSignUp(userInfo);
        return ResponseUtil.ok();
    }

    // 로그인
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @RequestBody LoginRequest request
    ) {
        User user = authService.login(request);
        String accessToken = jwtTokenProvider.createAccessToken(user.getId());

        return ResponseUtil.okWithCookies(
                new LoginResponse(user.getName()),
                cookieUtil.createAccessToken(accessToken)
        );
    }

    // 카카오 로그인
    @PostMapping("/oauth/login")
    public ResponseEntity<ApiResponse<LoginResponse>> oauthLogin(
            @RequestBody KakaoRequest request
    ) {
        KakaoUserInfo userInfo =
                kakaoOAuthClient.getUserInfo(request.getAccessToken());

        User user = authService.KakaoLogin(userInfo.getKakaoId());
        String accessToken = jwtTokenProvider.createAccessToken(user.getId());

        return ResponseUtil.okWithCookies(
                new LoginResponse(user.getName()),
                cookieUtil.createAccessToken(accessToken)
        );
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout() {
        return ResponseUtil.okWithCookies(
                cookieUtil.deleteAccessToken()
        );
    }
}
