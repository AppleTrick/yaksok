package com.ssafy.yaksok.facade.userProductNotification;

import com.ssafy.yaksok.notification.entity.Notification;
import com.ssafy.yaksok.notification.service.NotificationService;
import com.ssafy.yaksok.product.dto.RegisterUserProductSelfRequest;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.service.UserProductService;
import com.ssafy.yaksok.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public void registerNotificaion(Long userId, RegisterUserProductSelfRequest request){
        UserProduct userProduct = userProductService.findByUserIdAndNickname(userId, request.getNickname());

        notificationService.createNotification(userId, userProduct.getId(), request.getNickname(), request.getTime(), request.getCategory());
    }
}
