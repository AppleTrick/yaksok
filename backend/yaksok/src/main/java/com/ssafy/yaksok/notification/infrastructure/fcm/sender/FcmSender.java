package com.ssafy.yaksok.notification.infrastructure.fcm.sender;

import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class FcmSender {

    public void sendWeb(String token, String title, String body, Long noId) {
        Message message = Message.builder()
                .setToken(token)
                .putData("title", title)
                .putData("body", body)
                .putData("id", String.valueOf(noId))
                .putData("timestamp", String.valueOf(System.currentTimeMillis()))
                .build();

            FirebaseMessaging.getInstance().sendAsync(message);
            log.info("전송 완료");
        }
    public void sendAndroid(String token, String title, String body) {
        Message message = Message.builder()
                .setToken(token)
                .setNotification(
                        Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build()
                )
                .build();

        FirebaseMessaging.getInstance().sendAsync(message);
    }
    public void sendIos(String token, String title, String body) {
        // iOS도 Notification payload 필수
        sendAndroid(token, title, body);
    }
}

