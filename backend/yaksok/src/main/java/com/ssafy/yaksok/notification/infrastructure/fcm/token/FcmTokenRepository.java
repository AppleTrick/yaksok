package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<UserFcmToken, Long> {
    Optional<UserFcmToken> findByUserId(long userId);

    boolean existsByUserId(long userId);

    boolean existsByUserIdAndActiveTrue(long userId);

    List<UserFcmToken> findAllByUserIdAndActiveTrue(Long userId);

    Optional<UserFcmToken> findByUserIdAndPlatform(long userId, NotificationEnums.Platform platform);

    Optional<UserFcmToken> findByToken(String token);
}
