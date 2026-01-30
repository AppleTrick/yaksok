package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FcmTokenRequest {
    private String token;
    //가능하면 enums으로 관리해서 저장하기.
    //private String platform
}
