package com.ssafy.yaksok.notification.dto;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class NotificationEditRequest {
    private long notificationId;
    private long userProductId;
    private LocalTime intakeTime;
    private NotificationEnums.Category category;
    private java.util.List<@jakarta.validation.constraints.Min(1) @jakarta.validation.constraints.Max(7) Integer> daysOfWeek;
}
