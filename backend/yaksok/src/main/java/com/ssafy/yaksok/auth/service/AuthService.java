package com.ssafy.yaksok.auth.service;

import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.LoginRequest;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
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

    public User KakaoLogin(String oauthId){
        return userService.kakaoAuthenticate(oauthId);
    }

    public void signUp(SignupRequest request){
        User user = User.createLocalUser(request.getEmail(),
                request.getPassword(), request.getName(), request.getName(), request.getGender());

        log.info("ser {}", user.getPassword());
        userService.signup(user);
    }

    public void KaKaoSignUp(KakaoUserInfo kakaoUserInfo){
        User user = User.createKakaoUser(kakaoUserInfo.getEmail(),
                kakaoUserInfo.getNickname(), kakaoUserInfo.getKakaoId(), null, null);

        userService.signup(user);
    }

    //만약 리프레시 토큰을 활용하면 이걸 활용해서 지우자.
    public void logout(){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        long userId = userPrincipal.getUserId();
    }


}
