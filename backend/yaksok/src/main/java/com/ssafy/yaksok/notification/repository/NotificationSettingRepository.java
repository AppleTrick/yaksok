package com.ssafy.yaksok.notification.repository;

import com.ssafy.yaksok.notification.entity.NotificationSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, Long> {
}
