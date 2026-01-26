package com.ssafy.yaksok.auth.service;

import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.LoginRequest;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AuthService {
    private final UserService userService;

    public AuthService(UserService userService, JwtTokenProvider jwtTokenProvider, JwtTokenResolver jwtTokenResolver) {
        this.userService = userService;
    }

    //쿠키 1시간
    public User login(LoginRequest request) {
        return userService.authenticate(request.getEmail(), request.getPassword());
    }

    public User KakaoLogin(KakaoUserInfo kakaoUserInfo){
        if(userService.existsOauthId(kakaoUserInfo.getKakaoId())){
            return userService.kakaoAuthenticate(kakaoUserInfo.getKakaoId());
        }
        userService.kakaoSignUp(kakaoUserInfo);
        return userService.kakaoAuthenticate(kakaoUserInfo.getKakaoId());
    }

    public void signUp(SignupRequest request){
        userService.signUp(request);
    }

    //만약 리프레시 토큰을 활용하면 이걸 활용해서 지우자.
    public void logout(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        long userId = userPrincipal.getUserId();
    }


}
