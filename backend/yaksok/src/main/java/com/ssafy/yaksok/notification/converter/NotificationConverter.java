package com.ssafy.yaksok.notification.converter;

import com.ssafy.yaksok.notification.dto.NotificationResponse;
import com.ssafy.yaksok.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationConverter {

    public NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getEnabled()
        );
    }
}
