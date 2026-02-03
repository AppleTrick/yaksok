package com.ssafy.yaksok.notification.service;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;

    @Scheduled(cron = "0 */5 * * * *")
    @SchedulerLock(
            name = "notification_send_job",
            lockAtLeastFor = "PT4M", // 최소 4분은 락 유지 (5분 주기보다 살짝 짧게)
            lockAtMostFor = "PT10M"  // 최대 10분 (예상 최대 처리시간보다 약간 길게)
    )
    public void sendNotifications() {
        notificationService.processNotifications();
    }
}

