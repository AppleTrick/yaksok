package com.ssafy.yaksok.notification.dto;

import com.ssafy.yaksok.notification.entity.NotificationSetting;

import java.time.LocalTime;

public record NotificationSettingResponse(LocalTime quietStart, LocalTime quietEnd, boolean enabled) {

    public static NotificationSettingResponse from(NotificationSetting s) {
        return new NotificationSettingResponse(s.getQuietStart(), s.getQuietEnd(), s.getEnabled());
    }

    public static NotificationSettingResponse off() {
        return new NotificationSettingResponse(LocalTime.of(22, 0), LocalTime.of(7, 0), false);
    }
}
