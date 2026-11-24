package com.ssafy.yaksok.notification;

import com.ssafy.yaksok.notification.entity.Notification;
import com.ssafy.yaksok.notification.enums.NotificationEnums.Category;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationDueTest {

    // 2026-11-25는 수요일
    private static final LocalDateTime NINE = LocalDateTime.of(2026, 11, 25, 9, 0);

    private Notification at(int hour) {
        return Notification.create(1, 1, "비타민", LocalTime.of(hour, 0), Category.AFTERMEAL, true, false);
    }

    @Test
    @DisplayName("만든 시각과 상관없이 복용 시각이 되면 울린다 (밤에 만든 아침 알림이 막히던 버그)")
    void ringsRegardlessOfCreationTime() {
        assertThat(at(9).isDue(NINE)).isTrue();
        assertThat(at(9).isDue(NINE.minusMinutes(1))).isFalse();
    }

    @Test
    @DisplayName("자정 직전에 미뤄도 다음 날 아침 알림을 막지 않는다")
    void snoozeDoesNotLeakIntoNextDay() {
        Notification n = at(9);
        n.snooze(LocalDateTime.of(2026, 11, 24, 23, 55));
        assertThat(n.isDue(NINE)).isTrue();
    }

    @Test
    @DisplayName("10분 간격으로 세 번까지만 울린다")
    void remindsThreeTimes() {
        Notification n = at(9);
        for (int i = 0; i < 3; i++) {
            LocalDateTime now = NINE.plusMinutes(10L * i);
            assertThat(n.isDue(now)).isTrue();
            n.markSent(now);
            assertThat(n.isDue(now.plusMinutes(9))).isFalse();
        }
        assertThat(n.isDue(NINE.plusHours(5))).isFalse();
    }

    @Test
    @DisplayName("고른 요일에만 울리고, 비우거나 모두 고르면 매일 울린다")
    void ringsOnChosenDays() {
        Notification n = at(9);
        n.changeDays(Set.of(DayOfWeek.MONDAY, DayOfWeek.FRIDAY));
        assertThat(n.isDue(NINE)).isFalse();
        assertThat(n.isDue(NINE.plusDays(2))).isTrue();
        n.changeDays(Set.of(DayOfWeek.values()));
        assertThat(n.isDue(NINE)).isTrue();
    }

    @Test
    @DisplayName("먹었거나 꺼 둔 알림은 울리지 않는다")
    void silentWhenTakenOrDisabled() {
        Notification taken = at(9);
        taken.taken();
        Notification off = at(9);
        off.disable();
        assertThat(taken.isDue(NINE)).isFalse();
        assertThat(off.isDue(NINE)).isFalse();
    }
}
