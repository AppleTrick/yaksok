package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.notification.enums.NotificationEnums;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenRepository fcmTokenRepository;

    public void verifyFcmToken(long userId) {
        if (!fcmTokenRepository.existsByUserIdAndActiveTrue(userId)) {
            throw new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND);
        }
    }

    // CRUD
    @org.springframework.transaction.annotation.Transactional
    public void createOrUpdateFcmToken(long userId, FcmTokenRequest request) {
        log.info("FCM 토큰 동기화 요청 처리 시작: userId={}, platform={}", userId, request.getDeviceType());
        fcmTokenRepository.findByUserIdAndPlatform(userId, request.getDeviceType())
                .ifPresentOrElse(
                        existing -> {
                            log.info("기존 FCM 토큰 업데이트: userId={}, platform={}", userId, request.getDeviceType());
                            existing.updateToken(request.getFcmToken());
                        },
                        () -> {
                            log.info("새로운 FCM 토큰 저장: userId={}, platform={}", userId, request.getDeviceType());
                            fcmTokenRepository.save(
                                    UserFcmToken.createToken(
                                            userId,
                                            request.getFcmToken(),
                                            request.getDeviceType()));
                        });
        log.info("FCM 토큰 동기화 요청 처리 완료: userId={}", userId);
    }

    public Optional<UserFcmToken> findByUserIdAndPlatform(long userId, NotificationEnums.Platform platform) {
        return fcmTokenRepository.findByUserIdAndPlatform(userId, platform);
    }

    public List<UserFcmToken> findAllByUserIdAndActiveTrue(long userId) {
        return fcmTokenRepository.findAllByUserIdAndActiveTrue(userId);
    }

    public UserFcmToken findByUserId(long userId) {
        return fcmTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND));
    }

    public void updateToken(long userId, String token) {
        UserFcmToken userFcmToken = findByUserId(userId);

        userFcmToken.updateToken(token);
    }

    public void updateTokenActive(long userId, boolean active) {
        UserFcmToken userFcmToken = findByUserId(userId);

        userFcmToken.changeActive(active);
    }

    @org.springframework.transaction.annotation.Transactional
    public void deactivateToken(String token) {
        fcmTokenRepository.findByToken(token)
                .ifPresent(t -> {
                    log.info("유효하지 않은 FCM 토큰 비활성화 처리: token={}", token);
                    t.changeActive(false);
                });
    }

    public boolean existedByUserId(long userId) {
        return fcmTokenRepository.existsByUserId(userId);
    }

}
