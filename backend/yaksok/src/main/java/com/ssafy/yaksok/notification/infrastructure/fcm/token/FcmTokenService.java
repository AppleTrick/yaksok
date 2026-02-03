package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.notification.enums.NotificationEnums;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class FcmTokenService {

    private final FcmTokenRepository fcmTokenRepository;

    public void verifyFcmToken(long userId){
        if (!fcmTokenRepository.existsByUserIdAndActiveTrue(userId)) {
            throw new BusinessException(ErrorCode.FCM_TOKEN_NOT_FOUND);
        }
    }

    //CRUD
    @Transactional
    public void createOrUpdateFcmToken(long userId, FcmTokenRequest request) {
        fcmTokenRepository.findByUserIdAndPlatform(userId, request.getDeviceType())
                .ifPresentOrElse(
                        token -> token.updateToken(request.getFcmToken()),
                        () -> fcmTokenRepository.save(
                                UserFcmToken.createToken(
                                        userId,
                                        request.getFcmToken(),
                                        request.getDeviceType()
                                )
                        )
                );
    }

    public Optional<UserFcmToken> findByUserIdAndPlatform(long userId, NotificationEnums.Platform platform){
        return fcmTokenRepository.findByUserIdAndPlatform(userId, platform);
    }

    public List<UserFcmToken> findAllByUserIdAndActiveTrue(long userId){
        return fcmTokenRepository.findAllByUserIdAndActiveTrue(userId);
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

    public boolean existedByUserId(long userId){
        return fcmTokenRepository.existsByUserId(userId);
    }

}
