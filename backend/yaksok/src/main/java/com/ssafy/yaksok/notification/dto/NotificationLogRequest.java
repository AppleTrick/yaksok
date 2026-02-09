package com.ssafy.yaksok.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class NotificationLogRequest {
    private Long userId;
    private Long productId;
    private String notificationType;
    private LocalTime sentAt;
}
