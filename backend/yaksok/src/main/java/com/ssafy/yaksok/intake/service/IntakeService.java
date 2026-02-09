package com.ssafy.yaksok.intake.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.intake.dto.IntakeResponse;
import com.ssafy.yaksok.notification.entity.Notification;
import com.ssafy.yaksok.notification.repository.NotificationRepository;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.repository.UserProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntakeService {

    private final UserProductRepository userProductRepository;
    private final NotificationRepository notificationRepository;

    /**
     * 특정 날짜의 복용 스케줄 조회
     */
    @Transactional(readOnly = true)
    public List<IntakeResponse> getDailyIntakes(Long userId, LocalDate date) {
        // 1. 사용자의 모든 영양제 가져오기
        List<UserProduct> userProducts = userProductRepository.findAllByUserId(userId);

        // 2. 날짜 필터링 (활성화 상태 && 기간 내)
        return userProducts.stream()
                .filter(up -> isActiveOnDate(up, date))
                .map(this::toIntakeResponse)
                .collect(Collectors.toList());
    }

    /**
     * 오늘 날짜에 먹어야 하는 약인지 체크
     */
    private boolean isActiveOnDate(UserProduct up, LocalDate date) {
        // 비활성화된 제품 제외
        if (!up.isActive())
            return false;
        return true;
    }

    private IntakeResponse toIntakeResponse(UserProduct up) {

        Long productId = null;
        String productName = null;
        boolean isTaken = false;

        if (up.getProduct() != null) {
            productId = up.getProduct().getId();
            productName = up.getProduct().getPrdlstNm();
        }
        Notification no = notificationRepository.findByUserIdAndUserProductId(up.getUser().getId(), up.getId());
        if (no != null) {
            isTaken = no.isTaken();
        }

        return new IntakeResponse(
                up.getId(),
                productId, // 셀프 등록이면 null
                productName, // 셀프 등록이면 null
                up.getNickname(),
                up.getDailyDose(),
                up.getDoseAmount(),
                up.getDoseUnit(),
                up.isActive(),
                isTaken);

    }

    /**
     * 복용 체크 - active를 true로 변경하고, 연결된 notification의 intaken도 true로 업데이트
     */
    @Transactional
    public void checkIntake(Long userId, Long userProductId) {
        log.info("복용 체크 시도: userId={}, userProductId={}", userId, userProductId);

        // 1. UserProduct 조회
        UserProduct userProduct = userProductRepository.findById(userProductId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PRODUCT_NOT_FOUND));

        // 2. 권한 검증 (본인 것만 체크 가능)
        if (!userProduct.getUser().getId().equals(userId)) {
            log.warn("권한 없는 복용 체크 시도: userId={}, ownerId={}",
                    userId, userProduct.getUser().getId());
            throw new BusinessException(ErrorCode.USER_PRODUCT_UNAUTHORIZED);
        }

        // 3. active 활성화
        userProduct.activate();

        // 4. 연결된 Notification의 intaken도 true로 업데이트
        Notification notification = notificationRepository.findByUserIdAndUserProductId(userId, userProductId);
        if (notification != null) {
            if (notification.getIntaken()) {
                notification.nottaken();
            } else {
                notification.taken();
            }
            log.info("알림 복용 상태 업데이트: notificationId={}, intaken={}", notification.getId(), notification.getIntaken());
        } else {
            log.warn("연결된 알림을 찾을 수 없음: userId={}, userProductId={}", userId, userProductId);
        }

        log.info("복용 체크 완료: userProductId={}, active={}", userProductId, userProduct.isActive());
    }
}