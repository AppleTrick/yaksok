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
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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

    @Transactional
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
        notification.snooze(LocalDateTime.now());
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
                notification.getIntakeTime(), notification.getEnabled(), notification.getCategory(),
                notification.days().stream().map(DayOfWeek::getValue).sorted().toList());
    }

    @Transactional
    public NotificationResponse editNotification(long userId, NotificationEditRequest request) {
        Notification notification = verifyNotification(userId, request.getNotificationId());

        notification.setCategory(request.getCategory());
        notification.setTime(request.getIntakeTime());
        if (request.getDaysOfWeek() != null) {
            notification.changeDays(toDays(request.getDaysOfWeek()));
        }

        return new NotificationResponse(request.getNotificationId(), notification.getEnabled());
    }

    @Transactional(readOnly = true)
    public NotificationSettingResponse getNotificationSetting(long userId) {
        return notificationSettingRepository.findByUserId(userId)
                .map(NotificationSettingResponse::from)
                .orElseGet(NotificationSettingResponse::off);
    }

    /** 방해금지 시간은 사용자마다 하나. 없으면 만들고 있으면 고친다. */
    @Transactional
    public NotificationSettingResponse saveNotificationSetting(long userId, LocalTime start, LocalTime end, boolean enabled) {
        NotificationSetting setting = notificationSettingRepository.findByUserId(userId)
                .orElseGet(() -> NotificationSetting.create(userId, start, end, enabled));
        setting.changeQuietTime(start, end);
        if (enabled) setting.enable(); else setting.disable();
        return NotificationSettingResponse.from(notificationSettingRepository.save(setting));
    }

    private static Set<DayOfWeek> toDays(List<Integer> days) {
        return days.stream().map(DayOfWeek::of).collect(Collectors.toSet());
    }

    public Notification verifyNotification(long userId, long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if (notification.getUserId() != userId) {
            throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }

        return notification;
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

    /**
     * 매분 한 번. @Async를 떼어 ShedLock이 실제 처리가 끝날 때까지 잠기게 했다
     * (비동기일 때는 큐에 넣자마자 잠금이 풀려 여러 서버가 중복 발송할 수 있었다).
     */
    @Transactional
    public void processNotifications(LocalDateTime now) {
        notificationRepository.fillMissingStateDate(now.toLocalDate());
        notificationRepository.startNewDay(now.toLocalDate());

        Map<Long, List<Notification>> dueByUser = notificationRepository
                .findAllByEnabledTrueAndIntakenFalseAndIntakeTimeLessThanEqual(now.toLocalTime()).stream()
                .filter(n -> n.isDue(now))
                .collect(Collectors.groupingBy(Notification::getUserId));

        dueByUser.forEach((userId, due) -> {
            if (isQuietTime(userId, now.toLocalTime())) return;   // 방해금지가 끝나면 그때 울린다
            if (deliver(userId, due)) {
                due.forEach(n -> n.markSent(now));
                notificationRepository.saveAll(due);
            } else {
                // 보낼 길이 없으면 보낸 것으로 치지 않는다. 접속하거나 알림을 허용하면 그때 울린다.
                log.info("알림을 보낼 경로가 없음: userId={}, count={}", userId, due.size());
            }
        });
    }

    /** 앱이 열려 있으면 SSE, 아니면 푸시. 하나라도 실제로 나갔을 때만 true */
    private boolean deliver(Long userId, List<Notification> due) {
        String body = due.stream().map(Notification::getNickname).distinct().collect(Collectors.joining(", "))
                + " 드실 시간이에요.";
        List<Long> ids = due.stream().map(Notification::getId).toList();
        List<Long> userProductIds = due.stream().map(Notification::getUserProductId).toList();

        if (sseService.sendNotification(userId, new SseNotificationResponse(ids, userProductIds, body, "MEDICATION"))) {
            return true;
        }
        boolean sent = false;
        for (UserFcmToken token : fcmTokenService.findAllByUserIdAndActiveTrue(userId)) {
            sent |= fcmSender.sendWeb(token.getToken(), "💊 복약 알림", body, ids, userProductIds);
        }
        return sent;
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

    public Optional<UserFcmToken> findByUserIdAndPlatform(long userId, NotificationEnums.Platform platform) {
        return fcmTokenService.findByUserIdAndPlatform(userId, platform);
    }

    // CRUD
    public NotificationResponse createNotification(long userId, NotificationRequest notificationRequest) {

        Notification notification = Notification.create(userId, notificationRequest.getUserProductId(),
                notificationRequest.getNickname(),
                notificationRequest.getIntakeTime(), notificationRequest.getCategory(),
                true, false);

        notification = notificationRepository.save(notification);

        return notificationConverter.from(notification);
    }

    public void createNotification(long userId, long userProductId, String nickName, LocalTime inTakeTime,
            NotificationEnums.Category category) {
        Notification notification = Notification.create(userId, userProductId, nickName, inTakeTime,
                category, true, false);
        notificationRepository.save(notification);
    }

    public List<Notification> findAllByUserId(long userId) {
        return notificationRepository.findAllByUserId(userId);
    }

    public Notification findByUserIdAndUserProductId(long userId, long productId) {
        return notificationRepository.findByUserIdAndUserProductId(userId, productId);
    }

    @Transactional
    public void deleteNotification(long userId, long notificationId) {
        notificationRepository.delete(verifyNotification(userId, notificationId));
    }
}
