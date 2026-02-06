package com.ssafy.yaksok.notification.controller;

import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.notification.dto.*;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenRequest;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenService;
import com.ssafy.yaksok.notification.service.NotificationService;
import com.ssafy.yaksok.notification.service.SseService;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@RestController
@RequestMapping("/api/v1/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final FcmTokenService fcmTokenService;
    private final SseService sseService;

    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal userPrincipal,
            jakarta.servlet.http.HttpServletResponse response) {
        response.setHeader("X-Accel-Buffering", "no");
        response.setHeader("Cache-Control", "no-cache");
        response.setHeader("Connection", "keep-alive");
        response.setHeader("Content-Encoding", "identity"); // Gzip 압축 방지 (버퍼링 원인)
        if (userPrincipal == null) {
            log.error("SSE 구독 실패: 인증 정보가 없습니다.");
            throw new BusinessException(ErrorCode.AUTH_TOKEN_EMPTY);
        }
        log.info("SSE 구독 요청: userId={}", userPrincipal.getUserId());
        return sseService.subscribe(userPrincipal.getUserId());
    }

    @GetMapping("/sse-status")
    public ResponseEntity<ApiResponse<Boolean>> getSseStatus(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil.ok(sseService.isUserConnected(userPrincipal.getUserId()));
    }

    @PostMapping("/")
    public ResponseEntity<ApiResponse<NotificationResponse>> createNotification(
            @RequestBody NotificationRequest notificationRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil.ok(notificationService.createNotification(userPrincipal.getUserId(), notificationRequest));
    }

    @PutMapping("/enable/toggle")
    public ResponseEntity<ApiResponse<NotificationEnableToggleResponse>> enableToggleNotification(
            @RequestBody NotificationIdRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil.ok(
                notificationService.enableToggleNotification(userPrincipal.getUserId(), request.getNotificationId()));
    }

    @PutMapping("/taken/toggle")
    public ResponseEntity<ApiResponse<NotificationTakenToggleResponse>> takenToggleNotification(
            @RequestBody NotificationIdRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil.ok(
                notificationService.takenToggleNotification(userPrincipal.getUserId(), request.getNotificationId()));
    }

    @PutMapping("/taken")
    public ResponseEntity<ApiResponse<NotificationTakenToggleResponse>> takenNotification(
            @RequestBody NotificationIdRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.clearSnooze(userPrincipal.getUserId(), request.getNotificationId());
        return ResponseUtil.ok(notificationService.intake(userPrincipal.getUserId(), request.getNotificationId()));
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<NotificationListResponse>> getUsersNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil.ok(notificationService.getUserNotification(userPrincipal.getUserId()));
    }

    @GetMapping("/info/{userProductId}")
    public ResponseEntity<ApiResponse<NotificationProductResponse>> getUserProductNotification(
            @PathVariable Long userProductId, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil.ok(notificationService.getUserProductNotification(
                userPrincipal.getUserId(), userProductId));
    }

    @PutMapping("/")
    public ResponseEntity<ApiResponse<NotificationResponse>> editNotification(
            @RequestBody NotificationEditRequest notificationEditRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseUtil
                .ok(notificationService.editNotification(userPrincipal.getUserId(), notificationEditRequest));
    }

    @PutMapping("/snooze")
    public ResponseEntity<ApiResponse<Void>> snoozeNotification(
            @RequestBody NotificationSnoozeRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info(String.valueOf(request.getNotificationId()));
        notificationService.snoozeNotification(userPrincipal.getUserId(), request.getNotificationId());
        return ResponseUtil.ok();
    }

    @PostMapping("/setting")
    public ResponseEntity<ApiResponse<Void>> createNotificationSetting(
            @RequestBody NotificationSettingRequest notificationSettingRequest,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.createNotificationSetting(userPrincipal.getUserId(), notificationSettingRequest);
        return ResponseUtil.ok();
    }

    @PutMapping("/setting")
    public ResponseEntity<ApiResponse<Void>> editNotificationSetting(
            @RequestBody NotificationSettingEditRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        notificationService.editNotificationSetting(userPrincipal.getUserId(), request);
        return ResponseUtil.ok();
    }

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @RequestParam long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseUtil.ok();
    }

    @PostMapping("/token")
    public ResponseEntity<ApiResponse<Void>> createToken(
            @RequestBody FcmTokenRequest request, @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("FCM 토큰 등록/갱신 요청 수신: userId={}, platform={}", userPrincipal.getUserId(), request.getDeviceType());
        fcmTokenService.createOrUpdateFcmToken(userPrincipal.getUserId(), request);
        return ResponseUtil.ok();
    }

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Void>> checkToken(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        fcmTokenService.verifyFcmToken(userPrincipal.getUserId());
        return ResponseUtil.ok();
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Void>> testNotification(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        log.info("SSE 테스트 알림 발송 요청: userId={}", userPrincipal.getUserId());
        sseService.sendNotification(userPrincipal.getUserId(),
                new SseNotificationResponse(
                        java.util.Arrays.asList(0L),
                        java.util.Arrays.asList(0L),
                        "테스트 알림입니다! 실시간 연결이 확인되었습니다.",
                        "TEST"));
        return ResponseUtil.ok();
    }

    @GetMapping("/test/reset")
    public ResponseEntity<ApiResponse<Void>> resetTestNotification() {
        log.info("SSE 테스트를 위한 알림 상태 강제 초기화 요청");
        notificationService.resetDailyNotifications();
        return ResponseUtil.ok();
    }
}
