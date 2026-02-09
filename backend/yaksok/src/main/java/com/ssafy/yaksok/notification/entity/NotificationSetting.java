package com.ssafy.yaksok.notification.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification_setting")
public class NotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quiet_start", nullable = false)
    private LocalTime quietStart;

    @Column(name = "quiet_end", nullable = false)
    private LocalTime quietEnd;

    @Column(nullable = false)
    private Boolean enabled;

    /* 생성 메서드 */
    public static NotificationSetting create(
            Long userId,
            LocalTime quietStart,
            LocalTime quietEnd,
            boolean enabled
    ) {
        NotificationSetting setting = new NotificationSetting();
        setting.userId = userId;
        setting.quietStart = quietStart;
        setting.quietEnd = quietEnd;
        setting.enabled = enabled;
        return setting;
    }

    /* 상태 변경 메서드 */
    public void enable() {
        this.enabled = true;
    }

    public void disable() {
        this.enabled = false;
    }

    public void changeQuietTime(LocalTime quietStart, LocalTime quietEnd) {
        this.quietStart = quietStart;
        this.quietEnd = quietEnd;
    }
}
