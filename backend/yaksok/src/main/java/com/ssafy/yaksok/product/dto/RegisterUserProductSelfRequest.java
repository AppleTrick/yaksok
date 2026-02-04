package com.ssafy.yaksok.product.dto;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@AllArgsConstructor
public class RegisterUserProductSelfRequest {
    private String nickname;
    private NotificationEnums.Category category;
    private LocalTime time;
}
