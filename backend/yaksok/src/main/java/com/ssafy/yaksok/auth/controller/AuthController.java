package com.ssafy.yaksok.auth.controller;

import com.ssafy.yaksok.auth.client.KakaoOAuthClient;
import com.ssafy.yaksok.auth.dto.KakaoRequest;
import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.LoginRequest;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.auth.service.AuthService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.CookieUtil;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KakaoOAuthClient kakaoOAuthClient;
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @RequestMapping("/signup")
    public ResponseEntity<ApiResponse<Void>> signup(SignupRequest request){
        authService.signUp(request);
        return ResponseUtil.ok();
    }

    @RequestMapping("/oauth/signup")
    public ResponseEntity<ApiResponse<Void>> oauthSignup(KakaoRequest request){
        KakaoUserInfo kakaoUserInfo = kakaoOAuthClient.getUserInfo(request.getAccessToken());
        authService.KaKaoSignUp(kakaoUserInfo);
        return ResponseUtil.ok();
    }

    @RequestMapping("/login")
    public ResponseEntity<ApiResponse<Void>> login(LoginRequest request){
        long userId = authService.login(request);
        String token = jwtTokenProvider.createAccessToken(userId);
        return ResponseUtil.okWithCookies(cookieUtil.createAccessToken(token));
    }

    @RequestMapping("/oauth/login")
    public ResponseEntity<ApiResponse<Void>> oauthLogin(KakaoRequest request){
        KakaoUserInfo kakaoUserInfo = kakaoOAuthClient.getUserInfo(request.getAccessToken());
        authService.KakaoLogin(kakaoUserInfo.getKakaoId());

        long userId = authService.KakaoLogin(kakaoUserInfo.getKakaoId());
        String token = jwtTokenProvider.createAccessToken(userId);

        return ResponseUtil.okWithCookies(cookieUtil.createAccessToken(token));
    }

    @RequestMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(){
        //authService.logout(); - 리프레시 토큰 사용 시 활용.
        return ResponseUtil.okWithCookies(cookieUtil.deleteAccessToken());
    }
}
