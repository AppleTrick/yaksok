package com.ssafy.yaksok.facade.userProductNotification;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import com.ssafy.yaksok.notification.service.NotificationService;
import com.ssafy.yaksok.product.dto.RegisterUserProductRequest;
import com.ssafy.yaksok.product.dto.RegisterUserProductSelfRequest;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.service.UserProductService;
import com.ssafy.yaksok.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class UserProductNotificationService {
    private final UserService userService;
    private final UserProductService userProductService;
    private final NotificationService notificationService;

    public void registerUserProductSelf(Long userId, RegisterUserProductSelfRequest request) {
        UserProduct userProduct = UserProduct.create(userService.findByUserId((userId)), request.getNickname());
        userProductService.registerUserProductSelf(userProduct);
    }

    public void registerNotificaion(Long userId, RegisterUserProductSelfRequest request) {
        UserProduct userProduct = userProductService.findByUserIdAndNickname(userId, request.getNickname());
        notificationService.createNotification(userId, userProduct.getId(), request.getNickname(), request.getTime(),
                request.getCategory());
    }

    @Transactional
    public void registerUserProductWithNotification(Long userId, RegisterUserProductRequest request) {
        // 1. 제품 등록
        UserProduct saved = userProductService.registerUserProduct(userId, request);

        // 2. 알림 등록 (시간과 카테고리 정보가 있는 경우에만)
        if (request.getIntakeTime() != null && request.getIntakeCategory() != null) {
            try {
                LocalTime intakeTime = LocalTime.parse(request.getIntakeTime(), DateTimeFormatter.ofPattern("HH:mm"));
                NotificationEnums.Category category = NotificationEnums.Category.valueOf(request.getIntakeCategory());

                notificationService.createNotification(userId, saved.getId(), saved.getNickname(), intakeTime,
                        category);
            } catch (Exception e) {
                // 파싱 에러나 카테고리 매칭 에러 시 알림 등록만 스킵 (제품은 이미 등록됨)
                // 로그만 남기고 조용히 처리하거나 기본값 설정을 고려할 수 있음
            }
        }
    }
}
