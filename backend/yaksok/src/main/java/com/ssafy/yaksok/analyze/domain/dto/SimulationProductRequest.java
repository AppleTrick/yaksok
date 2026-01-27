package com.ssafy.yaksok.analyze.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 시뮬레이션할 추가 제품 정보
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationProductRequest {
    private Long productId; // 추가할 제품 ID
    private Integer dailyDose; // 하루 복용 횟수
}
