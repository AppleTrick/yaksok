package com.ssafy.yaksok.notification.repository;

import com.ssafy.yaksok.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

    @Repository
    public interface NotificationRepository extends JpaRepository<Notification, Long> {

        List<Notification> findAllByUserId(long userId);
        Notification findByUserIdAndUserProductId(Long userId, Long userProductId);
        @Query("""
        SELECT n FROM Notification n
        WHERE n.enabled = true
          AND n.intaken = false
          AND n.nextNotify <= :now
    """)
        List<Notification> findSendableNotifications(LocalDateTime now);
    }
