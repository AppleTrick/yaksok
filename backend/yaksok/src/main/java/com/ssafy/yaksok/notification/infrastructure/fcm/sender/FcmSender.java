package com.ssafy.yaksok.notification.infrastructure.fcm.sender;

import com.google.firebase.messaging.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@lombok.RequiredArgsConstructor
public class FcmSender {

        private final com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenService fcmTokenService;

        /**
         * 웹용 FCM 발송 (Bundling 지원 및 Data-only)
         */
        public void sendWeb(String token, String title, String body, List<Long> notificationIds,
                        List<Long> userProductIds) {
                String idsStr = notificationIds.stream().map(String::valueOf).collect(Collectors.joining(","));
                String productIdsStr = userProductIds.stream().map(String::valueOf).collect(Collectors.joining(","));

                Message message = Message.builder()
                                .setToken(token)
                                .putData("title", title)
                                .putData("body", body)
                                .putData("notificationIds", idsStr)
                                .putData("userProductIds", productIdsStr)
                                .putData("timestamp", String.valueOf(System.currentTimeMillis()))
                                .setWebpushConfig(WebpushConfig.builder()
                                                .putHeader("Urgency", "high")
                                                .putHeader("TTL", "3600")
                                                .build())
                                .setAndroidConfig(AndroidConfig.builder()
                                                .setPriority(AndroidConfig.Priority.HIGH)
                                                .build())
                                .build();

                log.info("FCM 웹 푸시(Bundling) 전송 시도: ids={}, token={}", idsStr, token);
                addCallback(FirebaseMessaging.getInstance().sendAsync(message), token, "Web", notificationIds.get(0));
        }

        public void sendAndroid(String token, String title, String body) {
                Message message = Message.builder()
                                .setToken(token)
                                .setNotification(Notification.builder()
                                                .setTitle(title)
                                                .setBody(body)
                                                .build())
                                .setAndroidConfig(AndroidConfig.builder()
                                                .setPriority(AndroidConfig.Priority.HIGH)
                                                .build())
                                .build();

                FirebaseMessaging.getInstance().sendAsync(message);
        }

        private void addCallback(com.google.api.core.ApiFuture<String> future, String token, String platform,
                        Long firstId) {
                future.addListener(() -> {
                        try {
                                String messageId = future.get();
                                log.info("FCM {} 전송 성공: messageId={}, firstNotificationId={}, token={}", platform,
                                                messageId,
                                                firstId, token);
                        } catch (Exception e) {
                                log.error("FCM {} 전송 실패: firstNotificationId={}, error={}", platform, firstId,
                                                e.getMessage());
                                if (e.getMessage().contains("registration-token-not-registered") ||
                                                e.getMessage().contains("not-found") ||
                                                e.getMessage().contains("invalid-registration-token")) {
                                        fcmTokenService.deactivateToken(token);
                                }
                        }
                }, Runnable::run);
        }
}
