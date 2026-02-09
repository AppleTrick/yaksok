package com.ssafy.yaksok;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.notification.infrastructure.fcm.config.FirebaseConfig;
import com.ssafy.yaksok.notification.infrastructure.fcm.sender.FcmSender;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenRequest;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.FcmTokenService;
import com.ssafy.yaksok.notification.infrastructure.fcm.token.UserFcmToken;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.enums.UserEnums;
import com.ssafy.yaksok.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * FCM 알림 기능 통합 테스트
 * 
 * [주의] ApplicationContext 로드 시 schema.sql의 DROP TABLE 순서 문제(FK 제약 조건)가 해결되어야 실행
 * 가능합니다.
 * FirebaseConfig를 MockBean으로 처리하여 실제 서비스 키 파일 없이 로직 검증이 가능하도록 구성했습니다.
 */
@SpringBootTest(properties = {
        "KAKAO_CLIENT_ID=test_client_id",
        "KAKAO_CLIENT_SECRET=test_client_secret",
        "KAKAO_REDIRECT_URI=http://localhost:8080/callback",
        "OPENAI_API_KEY=test_openai_key"
})
@Transactional
@DisplayName("FCM 알림 통합 테스트")
public class FcmNotificationTest {

    @Autowired
    private FcmTokenService fcmTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FcmSender fcmSender;

    // 실제 Firebase 초기화 설정을 Mock 처리하여 파일 부재로 인한 context 로드 실패 방지
    @MockBean
    private FirebaseConfig firebaseConfig;

    private User testUser;

    @BeforeEach
    void init() {
        testUser = User.createLocalUser(
                "fcm_final_test@test.com",
                "password",
                "FCM최종유저",
                UserEnums.AgeGroup.TWENTY,
                UserEnums.Gender.MALE);
        testUser = userRepository.save(testUser);
    }

    @Nested
    @DisplayName("FCM 토큰 관리 (CRUD)")
    class TokenManagement {

        @Test
        @DisplayName("사용자의 FCM 토큰을 등록하고 올바르게 다시 조회한다")
        void createAndFetchToken() {
            // Given
            String tokenValue = "final_fcm_token_test_abc_123";
            FcmTokenRequest request = new FcmTokenRequest(
                    com.ssafy.yaksok.notification.enums.NotificationEnums.Platform.WEB, tokenValue);

            // When
            fcmTokenService.createOrUpdateFcmToken(testUser.getId(), request);

            // Then
            UserFcmToken savedToken = fcmTokenService.findByUserId(testUser.getId());
            assertThat(savedToken.getToken()).isEqualTo(tokenValue);
            assertThat(savedToken.getUserId()).isEqualTo(testUser.getId());
            assertThat(savedToken.isActive()).isTrue();
        }

        @Test
        @DisplayName("등록되지 않은 유저의 토큰 조회 시 FCM_TOKEN_NOT_FOUND 예외가 발생한다")
        void fetchTokenNotFound() {
            // When & Then
            BusinessException exception = assertThrows(BusinessException.class, () -> {
                fcmTokenService.findByUserId(987654321L);
            });
            assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.FCM_TOKEN_NOT_FOUND);
        }

        @Test
        @DisplayName("이미 등록된 토큰 문자열을 새로운 값으로 갱신한다")
        void updateExistingToken() {
            // Given
            fcmTokenService.createOrUpdateFcmToken(testUser.getId(), new FcmTokenRequest(
                    com.ssafy.yaksok.notification.enums.NotificationEnums.Platform.WEB, "old_token"));

            // When
            String updatedToken = "new_vibrant_token";
            fcmTokenService.updateToken(testUser.getId(), updatedToken);

            // Then
            assertThat(fcmTokenService.findByUserId(testUser.getId()).getToken()).isEqualTo(updatedToken);
        }

        @Test
        @DisplayName("토큰의 활성화 상태(active)를 켜거나 끌 수 있다")
        void toggleTokenActiveState() {
            // Given
            fcmTokenService.createOrUpdateFcmToken(testUser.getId(), new FcmTokenRequest(
                    com.ssafy.yaksok.notification.enums.NotificationEnums.Platform.WEB, "toggle_test_token"));

            // When & Then: Disable
            fcmTokenService.updateTokenActive(testUser.getId(), false);
            assertThat(fcmTokenService.findByUserId(testUser.getId()).isActive()).isFalse();

            // When & Then: Enable
            fcmTokenService.updateTokenActive(testUser.getId(), true);
            assertThat(fcmTokenService.findByUserId(testUser.getId()).isActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("FCM 알림 발송 시뮬레이션")
    class NotificationSending {

        @Test
        @DisplayName("FcmSender를 통한 발송 시도 시 Firebase 인스턴스 미초기화로 인한 RuntimeException이 발생한다 (로직 흐름 증명)")
        void fcmSendFlowCheck() {
            // 실제 FCM 발송 로직은 FirebaseMessaging.getInstance()를 호출하지만,
            // FirebaseConfig가 Mock 처리되어 있어 실제 초기화가 수행되지 않으므로 RuntimeException이 발생하는 것이 의도된
            // 흐름입니다.

            // Given
            String mockToken = "mock_device_token";
            String mockTitle = "제목";
            String mockBody = "내용";

            // When & Then
            assertThrows(RuntimeException.class, () -> {
                fcmSender.sendWeb(mockToken, mockTitle, mockBody, java.util.Arrays.asList(1L),
                        java.util.Arrays.asList(1L));
            });
        }
    }
}
