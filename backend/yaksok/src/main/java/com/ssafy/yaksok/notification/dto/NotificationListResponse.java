package com.ssafy.yaksok.notification.dto;

import com.ssafy.yaksok.notification.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class NotificationListResponse {
    List<Notification> notifications;
}
