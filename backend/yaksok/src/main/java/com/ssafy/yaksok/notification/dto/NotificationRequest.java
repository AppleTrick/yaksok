package com.ssafy.yaksok.notification.dto;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import lombok.Getter;
import java.time.LocalTime;

@Getter
public class    NotificationRequest {
    long userProductId;
    LocalTime intakeTime;
    NotificationEnums.Category category;
}
