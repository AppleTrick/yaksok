package com.ssafy.yaksok.notification.service;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;

    @Scheduled(cron = "0 */1 * * * *")
    @SchedulerLock(
            name = "notification_send_job",
            lockAtLeastFor = "PT50S",
            lockAtMostFor = "PT2M"
    )
    public void sendNotifications() {
        notificationService.processNotifications();
    }
}

