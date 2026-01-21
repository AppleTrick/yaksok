package com.ssafy.yaksok.auth.client;

import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.KakaoUserResponse;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Component
@RequiredArgsConstructor
public class KakaoOAuthClient {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://kapi.kakao.com")
            .build();

    public KakaoUserInfo getUserInfo(String accessToken) {

        KakaoUserResponse response = webClient.get()
                .uri("/v2/user/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(KakaoUserResponse.class)
                .block();

        if (response == null) {
            throw new BusinessException(ErrorCode.AUTH_UNAUTHORIZED);
        }

        return new KakaoUserInfo(
                String.valueOf(response.getId()),
                response.getKakaoAccount().getEmail(),
                response.getKakaoAccount().getProfile().getNickname()
        );
    }
}

