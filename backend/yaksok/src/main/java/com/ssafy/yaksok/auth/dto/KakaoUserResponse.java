package com.ssafy.yaksok.auth.dto;

import lombok.Getter;

@Getter
public class KakaoUserResponse {

    private Long id;
    private KakaoAccount kakaoAccount;

    @Getter
    public static class KakaoAccount {
        private String email;
        private Profile profile;
    }

    @Getter
    public static class Profile {
        private String nickname;
    }
}

