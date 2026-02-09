package com.ssafy.yaksok.notification.repository;

import com.ssafy.yaksok.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

  List<Notification> findAllByUserId(long userId);

  void deleteAllByUserProductId(Long userProductId);

  Notification findByUserIdAndUserProductId(Long userId, Long userProductId);

  @Query("""
          SELECT n FROM Notification n
          WHERE n.enabled = true
            AND n.intaken = false
            AND n.intakeTime <= :now
            AND (n.nextNotify IS NULL OR n.nextNotify <= :now)
      """)
  List<Notification> findSendableNotifications(LocalTime now);

  Notification findByUserIdAndNickname(Long userId, String nickname);

  @org.springframework.data.jpa.repository.Modifying
  @org.springframework.data.jpa.repository.Query("UPDATE Notification n SET n.intaken = false")
  void resetAllIntakenStatus();

  long countByEnabledTrueAndIntakenFalse();

}
