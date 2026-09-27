package com.ssafy.yaksok.auth.client;

import com.ssafy.yaksok.auth.dto.KakaoTokenResponse;
import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.KakaoUserResponse;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class KakaoOAuthClient {

    @Value("${kakao.client-id}")
    private String clientId;

    @Value("${kakao.client-secret}")
    private String clientSecret;

    @Value("${kakao.redirect-uri}")
    private String redirectUri;

    private final WebClient webClient;

    /** Spring Boot의 WebClient.Builder를 받아야 계측(메트릭, 트레이스)이 붙는다 */
    public KakaoOAuthClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    // code → accessToken

    public String getAccessToken(String code) {

        KakaoTokenResponse response = webClient.post()
                .uri("https://kauth.kakao.com/oauth/token")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_FORM_URLENCODED_VALUE)
                .body(BodyInserters.fromFormData("grant_type", "authorization_code")
                        .with("client_id", clientId)
                        .with("redirect_uri", redirectUri)
                        .with("client_secret", clientSecret)
                        .with("code", code)
                )
                .retrieve()
                .onStatus(
                        status -> status.is4xxClientError() || status.is5xxServerError(),
                        res -> res.bodyToMono(String.class)
                                .map(body -> new RuntimeException("Kakao token error: " + body))
                )
                .bodyToMono(KakaoTokenResponse.class)
                .block();

        if (response == null || response.getAccessToken() == null) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_EMPTY);
        }

        System.out.println("Kakao access_token = " + response.getAccessToken());
        return response.getAccessToken();
    }

    //accessToken → user info
    public KakaoUserInfo getUserInfo(String accessToken) {

        KakaoUserResponse response = webClient.get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(KakaoUserResponse.class)
                .block();

        if (response == null) {
            throw new BusinessException(ErrorCode.AUTH_TOKEN_EMPTY);
        }

        return new KakaoUserInfo(
                String.valueOf(response.getId()),
                response.getKakaoAccount().getEmail(),
                response.getKakaoAccount().getProfile().getNickname()
        );
    }
}


