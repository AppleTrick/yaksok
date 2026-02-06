package com.ssafy.yaksok.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SseNotificationResponse {
    private List<Long> notificationIds;
    private List<Long> userProductIds;
    private String message;
    private String action; // "MEDICATION", "TEST" 등
}
