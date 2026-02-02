package com.ssafy.yaksok.notification.controller;

import com.google.protobuf.Api;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.notification.dto.*;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenRequest;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenService;
import com.ssafy.yaksok.notification.service.NotificationService;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.RequestEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final FcmTokenService fcmTokenService;

    @PostMapping("/")
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(
            @RequestBody NotificationRequest notificationRequest, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseUtil.ok(notificationService.createNotification(userPrincipal.getUserId(), notificationRequest));
    }

    @PutMapping("/enable/toggle")
    public ResponseEntity<ApiResponse<NotificationEnableToggleResponse>> enableToggleNotification(
            @RequestBody long notificationId, @AuthenticationPrincipal UserPrincipal userPrincipal){
                return ResponseUtil.ok(notificationService.enableToggleNotification(userPrincipal.getUserId(), notificationId));
    }

    @PutMapping("/taken/toggle")
    public ResponseEntity<ApiResponse<NotificationTakenToggleResponse>> takenToggleNotification(
            @RequestBody long notificationId, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseUtil.ok(notificationService.takenToggleNotification(userPrincipal.getUserId(), notificationId));
    }

    @PutMapping("/taken")
    public ResponseEntity<ApiResponse<NotificationTakenToggleResponse>> takenNofitication(
            @RequestBody long notificationId, @AuthenticationPrincipal UserPrincipal userPrincipal){
        notificationService.clearSnooze(userPrincipal.getUserId(), notificationId);
        return ResponseUtil.ok(notificationService.intake(userPrincipal.getUserId(), notificationId));
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<NotificationListResponse>> getUsersNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseUtil.ok(notificationService.getUserNotification(userPrincipal.getUserId()));
    }

    @GetMapping("/info/{userProductId}")
    public ResponseEntity<ApiResponse<NotificationProductResponse>> getUserProductNotification(
            @PathVariable Long userProductId, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseUtil.ok(notificationService.getUserProductNotification(
                userPrincipal.getUserId(), userProductId));
    }

    @PutMapping("/")
    public ResponseEntity<ApiResponse<NotificationResponse>> editNotification(
            @RequestBody NotificationEditRequest notificationEditRequest, @AuthenticationPrincipal UserPrincipal userPrincipal){
        return ResponseUtil.ok(notificationService.editNotification(userPrincipal.getUserId(), notificationEditRequest));
    }

    @PutMapping("/snoose")
    public ResponseEntity<ApiResponse<Void>> snoozeNotificaion(
            @RequestBody NotificationSnoozeRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal){
        notificationService.snooseNotification(userPrincipal.getUserId(), request.getNotificationId());
        return ResponseUtil.ok();
    }

    @PostMapping("/setting")
    public ResponseEntity<ApiResponse<Void>> createNotificationSetting(
            @RequestBody NotificationSettingRequest notificationSettingRequest, @AuthenticationPrincipal UserPrincipal userPrincipal){
            notificationService.createNotificationSetting(userPrincipal.getUserId(), notificationSettingRequest);
        return ResponseUtil.ok();
    }

    @PutMapping("/setting")
    public ResponseEntity<ApiResponse<Void>> editNotificationSetting(
            @RequestBody NotificationSettingEditRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal){
        notificationService.editNotificationSetting(userPrincipal.getUserId(), request);
        return ResponseUtil.ok();
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @RequestParam long notificationId){
        notificationService.deleteNotification(notificationId);
        return ResponseUtil.ok();
    }

    @PostMapping("/token")
    public ResponseEntity<ApiResponse<Void>> createToken(
            @RequestBody FcmTokenRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal){
        fcmTokenService.createFcmToken(userPrincipal.getUserId(), request);
        return ResponseUtil.ok();
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> checkToken(
            @AuthenticationPrincipal UserPrincipal userPrincipal){
        fcmTokenService.verifyFcmToken(userPrincipal.getUserId());
        return ResponseUtil.ok();
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Void>> testNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.sendTestNotification(userPrincipal.getUserId());
        return ResponseEntity.ok().build();
    }
}
