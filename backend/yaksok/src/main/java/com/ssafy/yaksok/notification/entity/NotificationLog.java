package com.ssafy.yaksok.notification.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification_log")
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_product_id", nullable = false)
    private Long userProductId;

    @Column(name = "notification_type", nullable = false)
    private String notificationType;

    @Column(name = "sent_at", nullable = false)
    private LocalTime sentAt;

    /* 생성 메서드 */
    public static NotificationLog create(
            Long userId,
            Long userProductId,
            String notificationType,
            LocalTime sentAt
    ) {
        NotificationLog log = new NotificationLog();
        log.userId = userId;
        log.userProductId = userProductId;
        log.notificationType = notificationType;
        log.sentAt = sentAt;
        return log;
    }
}
