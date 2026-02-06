package com.ssafy.yaksok.notification.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.notification.converter.NotificationConverter;
import com.ssafy.yaksok.notification.dto.*;
import com.ssafy.yaksok.notification.entity.Notification;
import com.ssafy.yaksok.notification.entity.NotificationLog;
import com.ssafy.yaksok.notification.entity.NotificationSetting;
import com.ssafy.yaksok.notification.enums.NotificationEnums;
import com.ssafy.yaksok.notification.infrastructure.fcm.sender.FcmSender;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenService;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.UserFcmToken;
import com.ssafy.yaksok.notification.repository.NotificationLogRepository;
import com.ssafy.yaksok.notification.repository.NotificationRepository;
import com.ssafy.yaksok.notification.repository.NotificationSettingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationConverter notificationConverter;
    private final NotificationSettingRepository notificationSettingRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final FcmTokenService fcmTokenService;
    private final FcmSender fcmSender;
    private final SseService sseService;

    public NotificationEnableToggleResponse enableToggleNotification(long userId, long notificationId) {
        Notification notification = verifyNotification(userId, notificationId);

        if (notification.getEnabled()) {
            notification.disable();
        } else {
            notification.enable();
        }

        return new NotificationEnableToggleResponse(notification.getId(), notification.getEnabled());
    }

    @Transactional
    public NotificationTakenToggleResponse takenToggleNotification(long userId, long notificationId) {
        Notification notification = verifyNotification(userId, notificationId);

        if (notification.getIntaken()) {
            notification.nottaken();
        } else {
            notification.taken();
        }

        return new NotificationTakenToggleResponse(notification.getId(), notification.getIntaken());
    }

    @Transactional
    public void snoozeNotification(long userId, long notificationId) {
        Notification notification = verifyNotification(userId, notificationId);
        notification.snoozeTime();
    }

    @Transactional
    public void clearSnooze(long userId, long notificationId) {
        Notification notification = verifyNotification(userId, notificationId);
        notification.clearSnooze();
    }

    @Transactional
    public NotificationTakenToggleResponse intake(long userId, long notificationId) {
        Notification notification = verifyNotification(userId, notificationId);
        notification.taken();

        return new NotificationTakenToggleResponse(notificationId, notification.getIntaken());
    }

    public NotificationListResponse getUserNotification(long userId) {
        return new NotificationListResponse(findAllByUserId(userId));
    }

    public NotificationProductResponse getUserProductNotification(long userId, long productId) {
        Notification notification = findByUserIdAndUserProductId(userId, productId);

        if (notification == null) {
            return new NotificationProductResponse();
        }

        return new NotificationProductResponse(notification.getId(), notification.getUserId(),
                notification.getUserProductId(),
                notification.getIntakeTime(), notification.getEnabled(), notification.getCategory());
    }

    public NotificationResponse editNotification(long userId, NotificationEditRequest request) {
        Notification notification = verifyNotification(userId, request.getNotificationId());

        notification.setCategory(request.getCategory());
        notification.setTime(request.getIntakeTime());

        return new NotificationResponse(request.getNotificationId(), notification.getEnabled());
    }

    public void editNotificationSetting(long userId, NotificationSettingEditRequest request) {
        NotificationSetting notificationSetting = verifyNotificationSetting(userId, request.getNotificationId());

        if (request.isEnabled()) {
            notificationSetting.enable();
        } else {
            notificationSetting.disable();
        }

        notificationSetting.changeQuietTime(request.getQuietStart(), request.getQuietEnd());
    }

    public Notification verifyNotification(long userId, long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (notification.getUserId() != userId) {
            throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }

        return notification;
    }

    public NotificationSetting verifyNotificationSetting(long userId, long notificationSettingId) {
        NotificationSetting notificationSetting = notificationSettingRepository.findById(notificationSettingId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_SETTING_NOT_FOUND));

        if (notificationSetting.getUserId() != userId) {
            throw new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND);
        }

        return notificationSetting;
    }

    public NotificationLog verifyNotificationLog(long userId, long notificationLogId) {
        NotificationLog notificationLog = notificationLogRepository.findById(notificationLogId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND));

        if (notificationLog.getUserId() != userId) {
            throw new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND);
        }

        return notificationLog;
    }

    public void sendTestNotification(long userId, NotificationEnums.Platform platform) {

        boolean isSseConnected = sseService.isUserConnected(userId);

        if (isSseConnected) {
            log.info("테스트 알람 전송 (SSE 우선): userId={}", userId);
            sseService.sendNotification(userId,
                    new SseNotificationResponse(
                            java.util.Arrays.asList(1L),
                            java.util.Arrays.asList(1L),
                            "테스트 알람: 소켓 연결 상태에서 보내는 알람입니다.",
                            "TEST"));
            return;
        }

        UserFcmToken tokenEntity = fcmTokenService
                .findByUserIdAndPlatform(userId, platform)
                .filter(UserFcmToken::isActive)
                .orElseThrow(() -> {
                    log.warn("FCM 토큰 없음 userId={}, platform={}", userId, platform);
                    return new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND);
                });

        log.info("테스트 알람 전송 (FCM 백업): userId={}", userId);
        fcmSender.sendWeb(
                tokenEntity.getToken(),
                "💊 복약 알림",
                "FCM 토큰을 통해 전송된 테스트 알림입니다.",
                java.util.Arrays.asList(1L),
                java.util.Arrays.asList(1L));
    }

    @org.springframework.transaction.annotation.Transactional
    public void resetDailyNotifications() {
        log.info("데일리 알림 상태 초기화 시작");
        notificationRepository.resetAllIntakenStatus();
        log.info("데일리 알림 상태 초기화 완료");
    }

    @Async("notificationExecutor")
    public void processNotifications() {
        LocalTime now = LocalTime.now();
        log.info("🔔 알람 전송 프로세스 시작 [현재 시각: {}]", now);

        long totalPendingCount = notificationRepository.countByEnabledTrueAndIntakenFalse();
        List<Notification> notifications = notificationRepository.findSendableNotifications(now);

        log.info("📊 알람 현황: 전체 미복용 알림={}건, 현재 발송 대상={}건", totalPendingCount, notifications.size());

        // 사용자별로 알림 그룹화 (Bundling)
        java.util.Map<Long, java.util.List<Notification>> groupedByUserId = notifications.stream()
                .collect(java.util.stream.Collectors.groupingBy(Notification::getUserId));

        for (java.util.Map.Entry<Long, java.util.List<Notification>> entry : groupedByUserId.entrySet()) {
            Long userId = entry.getKey();
            java.util.List<Notification> userNotifications = entry.getValue();

            if (isQuietTime(userId, now)) {
                log.info("알람 전송 스킵: 방해금지 시간 설정됨 - userId={}", userId);
                continue;
            }

            // 메시지 구성 (예: "비타민C, 오메가3 드실 시간입니다.")
            String nicknames = userNotifications.stream()
                    .map(Notification::getNickname)
                    .collect(java.util.stream.Collectors.groupingBy(java.util.function.Function.identity(),
                            java.util.stream.Collectors.counting()))
                    .keySet()
                    .stream()
                    .collect(java.util.stream.Collectors.joining(", "));
            String body = nicknames + "을(를) 복용할 시간입니다.";

            java.util.List<Long> notificationIds = userNotifications.stream()
                    .map(Notification::getId)
                    .collect(java.util.stream.Collectors.toList());
            java.util.List<Long> userProductIds = userNotifications.stream()
                    .map(Notification::getUserProductId)
                    .collect(java.util.stream.Collectors.toList());

            List<UserFcmToken> tokens = fcmTokenService.findAllByUserIdAndActiveTrue(userId);
            boolean isSseConnected = sseService.isUserConnected(userId);

            if (!isSseConnected && tokens.isEmpty()) {
                log.info("알람 전송 스킵: SSE 연결 없음 및 FCM 토큰 없음 - userId={}", userId);
                continue;
            }

            // 1. SSE 우선 발송 시도
            if (isSseConnected) {
                log.info("SSE 알람 번들 전송 (활성 연결 감지): userId={}, count={}", userId, userNotifications.size());
                sseService.sendNotification(userId,
                        new SseNotificationResponse(notificationIds, userProductIds, body, "MEDICATION"));
                continue;
            }

            // 2. SSE 연결이 없는 경우에만 FCM 발송
            if (!tokens.isEmpty()) {
                log.info("FCM 알람 번들 전송 (비활성/백그라운드 대응): userId={}, tokens={}, count={}",
                        userId, tokens.size(), userNotifications.size());
                for (UserFcmToken token : tokens) {
                    fcmSender.sendWeb(token.getToken(), "💊 복약 알림", body, notificationIds, userProductIds);
                }
            }
        }
        log.info("알람 전송 프로세스 종료");
    }

    private boolean isQuietTime(Long userId, LocalTime now) {
        return notificationSettingRepository.findByUserId(userId)
                .filter(NotificationSetting::getEnabled)
                .map(setting -> isBetween(now, setting.getQuietStart(), setting.getQuietEnd()))
                .orElse(false);
    }

    private boolean isBetween(LocalTime now, LocalTime start, LocalTime end) {
        // 같은 날 (예: 22:00 ~ 07:00 같은 케이스 처리)
        if (start.isBefore(end)) {
            return !now.isBefore(start) && !now.isAfter(end);
        }
        // 자정 넘어가는 경우
        return !now.isBefore(start) || !now.isAfter(end);
    }

    private void sendByPlatform(UserFcmToken token, Notification notification) {
        String body = notification.getNickname() + "을 복용할 시간입니다.";
        fcmSender.sendWeb(token.getToken(), "💊 복약 알림", body,
                java.util.Arrays.asList(notification.getId()),
                java.util.Arrays.asList(notification.getUserProductId()));
    }

    public Optional<UserFcmToken> findByUserIdAndPlatform(long userId, NotificationEnums.Platform platform) {
        return fcmTokenService.findByUserIdAndPlatform(userId, platform);
    }

    // CRUD
    public NotificationResponse createNotification(long userId, NotificationRequest notificationRequest) {

        Notification notification = Notification.create(userId, notificationRequest.getUserProductId(),
                notificationRequest.getNickname(),
                notificationRequest.getIntakeTime(), LocalTime.now(), notificationRequest.getCategory(),
                true, false);

        notification = notificationRepository.save(notification);

        return notificationConverter.from(notification);
    }

    public void createNotification(long userId, long userProductId, String nickName, LocalTime inTakeTime,
            NotificationEnums.Category category) {
        Notification notification = Notification.create(userId, userProductId, nickName, inTakeTime, LocalTime.now(),
                category, true, false);
        notificationRepository.save(notification);
    }

    public void createNotificationSetting(long userId, NotificationSettingRequest request) {
        NotificationSetting notificationSetting = NotificationSetting.create(userId, request.getQuietStart(),
                request.getQuietEnd(), true);
    }

    public List<Notification> findAllByUserId(long userId) {
        return notificationRepository.findAllByUserId(userId);
    }

    public Notification findByUserIdAndUserProductId(long userId, long productId) {
        return notificationRepository.findByUserIdAndUserProductId(userId, productId);
    }

    public void deleteNotification(long notificationId) {
        notificationRepository.deleteById(notificationId);
    }
}
