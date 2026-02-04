package com.ssafy.yaksok.intake.service;

import com.ssafy.yaksok.intake.dto.IntakeResponse;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.repository.UserProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IntakeService {

    private final UserProductRepository userProductRepository;

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
        if (!up.isActive()) return false;

        // 시작일 전이면 제외
        if (up.getStartDate() != null && date.isBefore(up.getStartDate())) {
            return false;
        }

        // 종료일 후면 제외
        if (up.getEndDate() != null && date.isAfter(up.getEndDate())) {
            return false;
        }

        return true;
    }

    private IntakeResponse toIntakeResponse(UserProduct up) {
        return IntakeResponse.builder()
                .userProductId(up.getId())
                .productId(up.getProduct().getId())
                .productName(up.getProduct().getPrdlstNm())
                .nickname(up.getNickname())
                .dailyDose(up.getDailyDose())
                .doseAmount(up.getDoseAmount())
                .doseUnit(up.getDoseUnit())
                .isTaken(false) // 섭취 여부는 추후 기능 구현 (우선 false)
                .build();
    }
}