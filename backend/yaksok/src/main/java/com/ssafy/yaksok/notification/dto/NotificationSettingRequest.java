package com.ssafy.yaksok.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class NotificationSettingRequest {
    private LocalTime quietStart;
    private LocalTime quietEnd;
}
