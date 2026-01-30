package com.ssafy.yaksok.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class NotificationEnableToggleResponse {
    private long notification_id;
    private boolean enable;
}
