package com.ssafy.yaksok.notification.entity;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "notification")
public class Notification {

    public static final Duration REMIND_INTERVAL = Duration.ofMinutes(10);
    public static final int MAX_REMINDERS = 3;

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

    /**
     * 이 시각까지는 다시 울리지 않는다. 날짜가 없는 next_notify(TIME)를 쓰던 때는
     * 밤에 만든 아침 알림이 다음 날에도 밤까지 막혔다.
     */
    @Column(name = "snoozed_until")
    private LocalDateTime snoozedUntil;

    /** 오늘 울린 횟수. 먹지 않아도 자정까지 계속 울리지 않게 한다. */
    @Column(name = "remind_count")
    private Integer remindCount;

    /** intaken, snoozedUntil, remindCount가 어느 날짜의 상태인지 */
    @Column(name = "state_date")
    private LocalDate stateDate;

    /** 울릴 요일 "1,3,5" (1=월, 7=일). 비어 있으면 매일 */
    @Column(name = "days_of_week", length = 20)
    private String daysOfWeek;

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
            NotificationEnums.Category category,
            boolean enabled,
            boolean isTaken
    ) {
        Notification n = new Notification();
        n.userId = userId;
        n.userProductId = userProductId;
        n.nickname = nickname;
        n.intakeTime = intakeTime;
        n.stateDate = LocalDate.now();
        n.remindCount = 0;
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

    public void taken() {
        this.intaken = true;
        this.snoozedUntil = null;
    }

    public void nottaken() {this.intaken = false; }

    /** 시간을 바꾸면 이전 시간 기준의 미루기와 횟수는 버린다 */
    public void setTime(LocalTime time) {
        this.intakeTime = time;
        this.snoozedUntil = null;
        this.remindCount = 0;
    }

    public void setCategory(NotificationEnums.Category category) { this.category = category; }

    public void snooze(LocalDateTime now) {
        this.snoozedUntil = now.plus(REMIND_INTERVAL);
        this.remindCount = 0;      // 사용자가 직접 미룬 것이므로 다시 처음부터 센다
    }

    public void clearSnooze() { this.snoozedUntil = null; }

    public void markSent(LocalDateTime now) {
        this.remindCount = reminders() + 1;
        this.snoozedUntil = now.plus(REMIND_INTERVAL);
    }

    public boolean isDue(LocalDateTime now) {
        return Boolean.TRUE.equals(enabled)
                && !Boolean.TRUE.equals(intaken)
                && intakeTime != null
                && !now.toLocalTime().isBefore(intakeTime)
                && runsOn(now.getDayOfWeek())
                && reminders() < MAX_REMINDERS
                && (snoozedUntil == null || !now.isBefore(snoozedUntil));
    }

    public boolean runsOn(DayOfWeek day) {
        Set<DayOfWeek> days = days();
        return days.isEmpty() || days.contains(day);
    }

    public Set<DayOfWeek> days() {
        if (daysOfWeek == null || daysOfWeek.isBlank()) return EnumSet.noneOf(DayOfWeek.class);
        return Arrays.stream(daysOfWeek.split(",")).map(d -> DayOfWeek.of(Integer.parseInt(d.trim())))
                .collect(Collectors.toCollection(() -> EnumSet.noneOf(DayOfWeek.class)));
    }

    public void changeDays(Set<DayOfWeek> days) {
        this.daysOfWeek = days == null || days.isEmpty() || days.size() == 7 ? null
                : days.stream().sorted().map(d -> String.valueOf(d.getValue())).collect(Collectors.joining(","));
    }

    private int reminders() { return remindCount == null ? 0 : remindCount; }

    public void changeIntakeTime(LocalTime intakeTime) {
        this.intakeTime = intakeTime;
    }
}
