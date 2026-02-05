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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
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

    public NotificationEnableToggleResponse enableToggleNotification(long userId, long notificationId){
        Notification notification = verifyNotification(userId, notificationId);

        if(notification.getEnabled()){
            notification.disable();
        }else{
            notification.enable();
        }

        return new NotificationEnableToggleResponse(notification.getId(), notification.getEnabled());
    }

    public NotificationTakenToggleResponse takenToggleNotification(long userId, long notificationId){
        Notification notification = verifyNotification(userId, notificationId);

        if(notification.getIntaken()){
            notification.nottaken();
        }else{
            notification.taken();
        }

        return new NotificationTakenToggleResponse(notification.getId(), notification.getIntaken());
    }
    
    public void snooseNotification(long userId, long notificationId){
        Notification notification = verifyNotification(userId, notificationId);

        notification.snoozeTime();
    }

    public void clearSnooze(long userId, long notificationId){
        Notification notification = verifyNotification(userId, notificationId);

        notification.clearSnooze();
    }

    public NotificationTakenToggleResponse intake(long userId, long  notificationId){
        Notification notification = verifyNotification(userId, notificationId);

        notification.nottaken();

        return new NotificationTakenToggleResponse(notificationId, notification.getIntaken());
    }

    public NotificationListResponse getUserNotification(long userId){
        return new NotificationListResponse(findAllByUserId(userId));
    }

    public NotificationProductResponse getUserProductNotification(long userId, long productId){
        Notification notification = findByUserIdAndUserProductId(userId, productId);

        if(notification == null){ return new NotificationProductResponse(); }

        return new NotificationProductResponse(notification.getId(), notification.getUserId(), notification.getUserProductId(),
                notification.getIntakeTime(), notification.getEnabled(), notification.getCategory());
    }

    public NotificationResponse editNotification(long userId, NotificationEditRequest request){
        Notification notification = verifyNotification(userId, request.getNotificationId());

        notification.setCategory(request.getCategory());
        notification.setTime(request.getIntakeTime());

        return new NotificationResponse(request.getNotificationId(), notification.getEnabled());
    }

    public void editNotificationSetting(long userId, NotificationSettingEditRequest request){
        NotificationSetting notificationSetting = verifyNotificationSetting(userId, request.getNotificationId());

        if(request.isEnabled()){
            notificationSetting.enable();
        }else{
            notificationSetting.disable();
        }

        notificationSetting.changeQuietTime(request.getQuietStart(), request.getQuietEnd());
    }


    public Notification verifyNotification(long userId, long notificationId){
        Notification notification = notificationRepository.findById(notificationId).orElseThrow(() ->
                new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND));

        if(notification.getUserId() != userId){
            throw new BusinessException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }

        return notification;
    }

    public NotificationSetting verifyNotificationSetting(long userId, long notificationSettingId){
        NotificationSetting notificationSetting = notificationSettingRepository.findById(notificationSettingId).orElseThrow(() ->
                new BusinessException(ErrorCode.NOTIFICATION_SETTING_NOT_FOUND));

        if(notificationSetting.getUserId() != userId){
            throw new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND);
        }

        return notificationSetting;
    }

    public NotificationLog verifyNotificationLog(long userId, long notificationLogId) {
        NotificationLog notificationLog = notificationLogRepository.findById(notificationLogId).orElseThrow(() ->
                new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND));

        if (notificationLog.getUserId() != userId) {
            throw new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND);
        }

        return notificationLog;
    }

    public void sendTestNotification(long userId, NotificationEnums.Platform platform) {

        UserFcmToken tokenEntity = fcmTokenService
                .findByUserIdAndPlatform(userId, platform)
                .filter(UserFcmToken::isActive)
                .orElseThrow(() -> {
                    log.warn("FCM 토큰 없음 userId={}, platform={}", userId, platform);
                    return new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND);
                });

        fcmSender.sendWeb(
                tokenEntity.getToken(),
                "테스트 알림",
                "버튼 눌러서 온 알림입니다"
        );
    }


    @Async("notificationExecutor")
    public void processNotifications() {
        log.info("알람 전송 시작");
        LocalTime now = LocalTime.now();

        List<Notification> notifications =
                notificationRepository.findSendableNotifications(now);

        for (Notification notification : notifications) {
            if (isQuietTime(notification.getUserId(), now)) {
                continue;
            }

            List<UserFcmToken> tokens =
                    fcmTokenService.findAllByUserIdAndActiveTrue(notification.getUserId());

            if (tokens.isEmpty() && !notification.getIntaken()) {
                continue;
            }

            for (UserFcmToken token : tokens) {
                sendByPlatform(token, notification);
            }
            log.info(String.valueOf(notification.getId()));
            log.info("알람 전송...");
        }
        log.info("알람 전송 종료");
    }

    private boolean isQuietTime(Long userId, LocalTime now) {
        return notificationSettingRepository.findByUserId(userId)
                .filter(NotificationSetting::getEnabled)
                .map(setting ->
                        isBetween(now, setting.getQuietStart(), setting.getQuietEnd())
                )
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

        if(token.getPlatform() == NotificationEnums.Platform.WEB){
            fcmSender.sendWeb(token.getToken(), "복약 알림", body);
        }else if(token.getPlatform() == NotificationEnums.Platform.ANDROID){
            fcmSender.sendAndroid(token.getToken(), "복약 알림", body);
        }else{
            fcmSender.sendIos(token.getToken(), "복약 알림", body);
        }
    }

    public Optional<UserFcmToken> findByUserIdAndPlatform(long userId, NotificationEnums.Platform platform){
        return fcmTokenService.findByUserIdAndPlatform(userId, platform);
    }

    //CRUD
    public NotificationResponse createNotification(long userId, NotificationRequest notificationRequest){

        Notification notification = Notification.create(userId, notificationRequest.getUserProductId(), notificationRequest.getNickname(),
                notificationRequest.getIntakeTime(), LocalTime.now(), notificationRequest.getCategory(),
                true, false);

        notification = notificationRepository.save(notification);

        return notificationConverter.from(notification);
    }

    public void createNotification(long userId, long userProductId, String nickName, LocalTime inTakeTime, NotificationEnums.Category category){
        Notification notification = Notification.create(userId, userProductId, nickName, inTakeTime, LocalTime.now(), category, true, false);
        notificationRepository.save(notification);
    }

    public void createNotificationSetting(long userId, NotificationSettingRequest request){
            NotificationSetting notificationSetting = NotificationSetting.create(userId, request.getQuietStart(), request.getQuietEnd(), true);
    }

    public List<Notification> findAllByUserId(long userId){
        return notificationRepository.findAllByUserId(userId);
    }

    public Notification findByUserIdAndUserProductId(long userId, long productId){
        return notificationRepository.findByUserIdAndUserProductId(userId, productId);
    }

    public void deleteNotification(long notificationId){
        notificationRepository.deleteById(notificationId);
    }
}
