package com.ssafy.yaksok.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class KakaoUserInfo {
    private String kakaoId;
    private String email;
    private String nickname;
}
