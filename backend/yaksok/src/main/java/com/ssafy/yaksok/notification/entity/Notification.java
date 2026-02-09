package com.ssafy.yaksok.notification.entity;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(name = "userProductId", nullable = false)
    private Long userProductId;

    @Column(name="nickname", nullable = false)
    private String nickname;

    @Column(name = "intake_time")
    private LocalTime intakeTime;

    @Column(name = "next_notify")
    private LocalTime nextNotify;

    @Column(nullable = false)
    private Boolean enabled;

    @Column(nullable = false)
    private Boolean intaken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationEnums.Category category;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public static Notification create(
            long userId,
            long userProductId,
            String nickname,
            LocalTime intakeTime,
            LocalTime nextNotify,
            NotificationEnums.Category category,
            boolean enabled,
            boolean isTaken
    ) {
        Notification n = new Notification();
        n.userId = userId;
        n.userProductId = userProductId;
        n.nickname = nickname;
        n.intakeTime = intakeTime;
        n.nextNotify = nextNotify;
        n.category = category;
        n.enabled = enabled;
        n.intaken = isTaken;
        return n;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public void enable() {
        this.enabled = true;
    }

    public boolean isTaken() { return this.intaken; }

    public void disable() {
        this.enabled = false;
    }

    public void taken() { this.intaken = true; }

    public void nottaken() {this.intaken = false; }

    public void setTime(LocalTime time) { this.intakeTime = time;}

    public void setCategory(NotificationEnums.Category category) { this.category = category; }

    public void snoozeTime(){ this.nextNotify = LocalTime.now().plusMinutes((long) 5);}

    public void clearSnooze(){ this.nextNotify = null; }

    public void changeIntakeTime(LocalTime intakeTime) {
        this.intakeTime = intakeTime;
    }
}
