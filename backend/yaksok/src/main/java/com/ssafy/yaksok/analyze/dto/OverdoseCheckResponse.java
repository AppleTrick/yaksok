package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 과복용 체크 API 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverdoseCheckResponse {
    private Long userId; // 사용자 ID
    private boolean hasAnyOverdose; // 하나라도 과복용인지
    private int overdoseCount; // 과복용 성분 개수
    private int totalIngredientCount; // 전체 성분 개수
    private List<IngredientOverdoseResult> results; // 성분별 결과
}
