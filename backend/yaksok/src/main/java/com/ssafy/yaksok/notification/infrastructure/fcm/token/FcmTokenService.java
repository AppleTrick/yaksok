package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenRepository fcmTokenRepository;

    public void verifyFcmToken(long userId){
        if(!findByUserId(userId).isActive()){
            throw new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND);
        }
    }

    //CRUD
    public void createFcmToken(long userId, FcmTokenRequest request){
        UserFcmToken userFcmToken = UserFcmToken.createToken(userId, request.getToken(), null);
        fcmTokenRepository.save(userFcmToken);
    }

    public UserFcmToken findByUserId(long userId){
        return fcmTokenRepository.findByUserId(userId).orElseThrow(() ->
                new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND)
        );
    }

    public void updateToken(long userId, String token){
        UserFcmToken userFcmToken = findByUserId(userId);

        userFcmToken.updateToken(token);
    }

    public void updateTokenActive(long userId, boolean active){
        UserFcmToken userFcmToken = findByUserId(userId);

        userFcmToken.changeActive(active);
    }



}
