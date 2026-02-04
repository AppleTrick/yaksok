package com.ssafy.yaksok.intake.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntakeResponse {

    private Long userProductId;   // 내 영양제 ID
    private Long productId;       // 제품 ID
    private String productName;   // 제품명 (비타민C)
    private String nickname;      // 별칭 (아침 약)

    private int dailyDose;        // 하루 섭취 횟수
    private BigDecimal doseAmount;// 1회 섭취량
    private String doseUnit;      // 단위

    private boolean isTaken;      // 섭취 완료 여부
}