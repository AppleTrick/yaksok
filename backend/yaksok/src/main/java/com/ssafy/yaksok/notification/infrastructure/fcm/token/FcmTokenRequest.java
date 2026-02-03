package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class FcmTokenRequest {
    private NotificationEnums.Platform deviceType;
    private String fcmToken;
    //가능하면 enums으로 관리해서 저장하기.
    //private String platform
}
