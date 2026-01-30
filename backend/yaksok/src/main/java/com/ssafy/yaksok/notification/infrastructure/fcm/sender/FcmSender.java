package com.ssafy.yaksok.notification.infrastructure.fcm.sender;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import org.springframework.stereotype.Component;

@Component
public class FcmSender {

    public void testSend(String token, String title, String body) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(
                        Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build()
                )
                .build();

        try {
            FirebaseMessaging.getInstance().send(message);
        } catch (Exception e) {
            throw new RuntimeException("FCM testSend fail", e);
        }
    }
}

