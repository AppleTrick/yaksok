package com.ssafy.yaksok.product.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 영양제 등록 요청 DTO
 */
@Getter
@Setter
public class RegisterUserProductRequest {

    private Long productId;           // 제품 ID
    private String nickname;          // 사용자 지정 이름
    private Integer dailyDose;        // 하루 복용 횟수
    private BigDecimal doseAmount;    // 1회 복용량
    private String doseUnit;          // 단위
    private LocalDate startDate;      // 복용 시작일
    private LocalDate endDate;        // 복용 종료일
}