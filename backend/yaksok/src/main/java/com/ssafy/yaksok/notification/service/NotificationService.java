package com.ssafy.yaksok.notification.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.notification.converter.NotificationConverter;
import com.ssafy.yaksok.notification.dto.*;
import com.ssafy.yaksok.notification.entity.Notification;
import com.ssafy.yaksok.notification.entity.NotificationLog;
import com.ssafy.yaksok.notification.entity.NotificationSetting;
import com.ssafy.yaksok.notification.infrastructure.fcm.sender.FcmSender;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenService;
import com.ssafy.yaksok.notification.repository.NotificationLogRepository;
import com.ssafy.yaksok.notification.repository.NotificationRepository;
import com.ssafy.yaksok.notification.repository.NotificationSettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public NotificationLog verifyNotificationLog(long userId, long notificationLogId){
        NotificationLog notificationLog = notificationLogRepository.findById(notificationLogId).orElseThrow(() ->
                new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND));

        if(notificationLog.getUserId() != userId){
            throw new BusinessException(ErrorCode.NOTIFICATION_LOG_NOT_FOUND);
        }

        return notificationLog;
    }

    public void sendTestNotificaion(long userId){
        String token = fcmTokenService.findByUserId(userId).getToken();

        fcmSender.testSend(
                token,
                "테스트 알림",
                "버튼 눌러서 온 알림입니다"
        );
    }

    //CRUD
    public NotificationResponse createNotification(long userId, NotificationRequest notificationRequest){

        Notification notification = Notification.create(userId, notificationRequest.getUserProductId(),
                notificationRequest.getIntakeTime(), notificationRequest.getCategory(),
                true, false);

        notification = notificationRepository.save(notification);

        return notificationConverter.from(notification);
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
