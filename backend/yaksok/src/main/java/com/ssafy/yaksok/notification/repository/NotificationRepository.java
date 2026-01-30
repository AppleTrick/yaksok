package com.ssafy.yaksok.notification.repository;

import com.ssafy.yaksok.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

    @Repository
    public interface NotificationRepository extends JpaRepository<Notification, Long> {

        List<Notification> findAllByUserId(long userId);
        Notification findByUserIdAndUserProductId(Long userId, Long userProductId);
    }
