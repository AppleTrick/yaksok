package com.ssafy.yaksok.notification.infrastructure.fcm.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.InputStream;

@Slf4j
@Configuration
public class FirebaseConfig {

    @Value("${firebase.credentials.path}")
    private Resource credentialsResource;

    @PostConstruct
    public void initialize() {
        if (!credentialsResource.exists()) {
            log.warn("Firebase 서비스 계정 키 파일을 찾을 수 없습니다. FCM 푸시 알림이 비활성화됩니다.");
            return;
        }

        try (InputStream is = credentialsResource.getInputStream()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(is))
                    .build();

            if (FirebaseApp.getApps().isEmpty()) {
                FirebaseApp.initializeApp(options);
            }
        } catch (Exception e) {
            log.warn("Firebase 초기화 실패. FCM 푸시 알림이 비활성화됩니다. 원인: {}", e.getMessage());
        }
    }
}