package com.ssafy.yaksok;

import com.ssafy.yaksok.notification.dto.*;
import com.ssafy.yaksok.notification.entity.Notification;
import com.ssafy.yaksok.notification.enums.NotificationEnums;
import com.ssafy.yaksok.notification.repository.NotificationRepository;
import com.ssafy.yaksok.notification.service.NotificationService;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.repository.ProductRepository;
import com.ssafy.yaksok.product.repository.UserProductRepository;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.enums.UserEnums;
import com.ssafy.yaksok.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "KAKAO_CLIENT_ID=test_client_id",
        "KAKAO_CLIENT_SECRET=test_client_secret",
        "KAKAO_REDIRECT_URI=http://localhost:8080/callback",
        "OPENAI_API_KEY=test_openai_key"
})
@Transactional
public class NotificationFlowTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserProductRepository userProductRepository;

    private long userId;
    private long userProductId;

    @BeforeEach
    void setUp() {
        // [0] 기초 데이터 생성 (FK 제약 조건 해결)
        User user = User.createLocalUser(
                "test@test.com",
                "password",
                "테스트유저",
                UserEnums.AgeGroup.TWENTY,
                UserEnums.Gender.MALE);
        user = userRepository.save(user);
        userId = user.getId();

        Product product = Product.builder()
                .prdlstNm("테스트 제품")
                .build();
        product = productRepository.save(product);

        UserProduct userProduct = UserProduct.create(
                user,
                user, // targetMember도 자신으로 설정
                product,
                "용이한 닉네임",
                1,
                new BigDecimal("1.0"),
                "정",
                LocalDate.now(),
                LocalDate.now().plusMonths(1));
        userProduct = userProductRepository.save(userProduct);
        userProductId = userProduct.getId();
    }

    @Test
    @DisplayName("알림 생성 및 조회 테스트")
    void createAndGetNotification() {
        // Given
        NotificationRequest createRequest = createNotificationRequest(userProductId, LocalTime.of(9, 0),
                NotificationEnums.Category.AFTERMEAL);

        // When
        NotificationResponse createResponse = notificationService.createNotification(userId, createRequest);
        long notificationId = createResponse.getNotificationSettingId();

        // Then
        assertThat(notificationId).isNotNull();
        assertThat(createResponse.isEnable()).isTrue();

        NotificationListResponse listResponse = notificationService.getUserNotification(userId);
        assertThat(listResponse.getNotifications()).anyMatch(n -> n.getId().equals(notificationId));
    }

    @Test
    @DisplayName("알림 활성화/비활성화 토글 테스트")
    void toggleNotificationEnable() {
        // Given
        long notificationId = setupNotification();

        // When & Then (Initial true -> false)
        NotificationEnableToggleResponse toggleResponse1 = notificationService.enableToggleNotification(userId,
                notificationId);
        assertThat(toggleResponse1.isEnable()).isFalse();

        // When & Then (False -> true)
        NotificationEnableToggleResponse toggleResponse2 = notificationService.enableToggleNotification(userId,
                notificationId);
        assertThat(toggleResponse2.isEnable()).isTrue();
    }

    @Test
    @DisplayName("알림 정보 수정 테스트")
    void editNotification() {
        // Given
        long notificationId = setupNotification();
        LocalTime updatedTime = LocalTime.of(13, 0);
        NotificationEnums.Category updatedCategory = NotificationEnums.Category.BEFORESLEEP;
        NotificationEditRequest editRequest = new NotificationEditRequest(notificationId, userProductId, updatedTime,
                updatedCategory);

        // When
        notificationService.editNotification(userId, editRequest);

        // Then
        Notification updatedNotification = notificationRepository.findById(notificationId).orElseThrow();
        assertThat(updatedNotification.getIntakeTime()).isEqualTo(updatedTime);
        assertThat(updatedNotification.getCategory()).isEqualTo(updatedCategory);
    }

    @Test
    @DisplayName("알림 복용 여부 토글 테스트")
    void toggleNotificationTaken() {
        // Given
        long notificationId = setupNotification();

        // When & Then (Initial false -> true)
        NotificationTakenToggleResponse takenToggleResponse = notificationService.takenToggleNotification(userId,
                notificationId);
        assertThat(takenToggleResponse.isTaken()).isTrue();

        // When & Then (True -> false)
        NotificationTakenToggleResponse takenToggleResponse2 = notificationService.takenToggleNotification(userId,
                notificationId);
        assertThat(takenToggleResponse2.isTaken()).isFalse();
    }

    @Test
    @DisplayName("알림 스누즈(미루기) 및 해제 테스트")
    void snoozeAndClearNotification() {
        // Given
        long notificationId = setupNotification();

        // When (Snooze - 오타 반영 snoose)
        notificationService.snooseNotification(userId, notificationId);

        // Then
        Notification snoozedNotification = notificationRepository.findById(notificationId).orElseThrow();
        assertThat(snoozedNotification.getNextNotify()).isNotNull();
        assertThat(snoozedNotification.getNextNotify()).isAfter(java.time.LocalDateTime.now());

        // When (Clear & Intake)
        notificationService.clearSnooze(userId, notificationId);
        notificationService.intake(userId, notificationId);

        // Then
        Notification finalNotification = notificationRepository.findById(notificationId).orElseThrow();
        assertThat(finalNotification.getNextNotify()).isNull();
        assertThat(finalNotification.getIntaken()).isFalse();
    }

    // --- Helper Methods ---

    private long setupNotification() {
        NotificationRequest createRequest = createNotificationRequest(userProductId, LocalTime.of(9, 0),
                NotificationEnums.Category.AFTERMEAL);
        return notificationService.createNotification(userId, createRequest).getNotificationSettingId();
    }

    private NotificationRequest createNotificationRequest(long userProductId, LocalTime time,
            NotificationEnums.Category category) {
        NotificationRequest request = new NotificationRequest();
        ReflectionTestUtils.setField(request, "userProductId", userProductId);
        ReflectionTestUtils.setField(request, "intakeTime", time);
        ReflectionTestUtils.setField(request, "category", category);
        return request;
    }
}
