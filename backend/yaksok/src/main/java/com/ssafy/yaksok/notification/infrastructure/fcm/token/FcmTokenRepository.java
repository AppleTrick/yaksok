package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FcmTokenRepository extends JpaRepository<UserFcmToken, Long> {
    Optional<UserFcmToken> findByUserId(long userId);
    List<UserFcmToken> findAllByUserIdAndActiveTrue(Long userId);
    Optional<UserFcmToken> findByUserIdAndPlatform(long userId, String platform);
}
