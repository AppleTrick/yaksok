package com.ssafy.yaksok.global.common.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 영양제 섭취 시간 추천 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IntakeTimeResponse {
    private String intakeTime; // HH:mm:ss 형식 (예: "08:00:00")
    private String category; // BEFOREMEAL, AFTERMEAL, BEFORESLEEP
}
