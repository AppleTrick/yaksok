package com.ssafy.yaksok.notification.repository;

import com.ssafy.yaksok.notification.entity.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    void deleteAllByUserProductId(Long userProductId);
}
