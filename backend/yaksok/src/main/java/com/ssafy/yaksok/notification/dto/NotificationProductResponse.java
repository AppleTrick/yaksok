package com.ssafy.yaksok.notification.dto;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class NotificationProductResponse {
    private Long id;
    private Long userId;
    private Long userProductId;
    private LocalTime intakeTime;
    private Boolean enabled;
    private NotificationEnums.Category category;
}
