package com.ssafy.yaksok.notification.repository;

import com.ssafy.yaksok.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

  List<Notification> findAllByUserId(long userId);

  void deleteAllByUserProductId(Long userProductId);

  Notification findByUserIdAndUserProductId(Long userId, Long userProductId);

  List<Notification> findAllByEnabledTrueAndIntakenFalseAndIntakeTimeLessThanEqual(LocalTime now);

  Notification findByUserIdAndNickname(Long userId, String nickname);

  /** 날짜가 바뀐 알림만 새 하루로 돌린다. 매분 돌려도 안전하고, 자정에 서버가 꺼져 있어도 놓치지 않는다. */
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
          UPDATE Notification n
             SET n.intaken = false, n.snoozedUntil = null, n.remindCount = 0, n.stateDate = :today
           WHERE n.stateDate < :today
      """)
  int startNewDay(LocalDate today);

  /** 이 칸이 생기기 전에 만든 알림: 오늘 복용 상태는 그대로 두고 날짜만 채운다 */
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE Notification n SET n.stateDate = :today WHERE n.stateDate IS NULL")
  int fillMissingStateDate(LocalDate today);

}
