package com.ssafy.yaksok.analyze.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 시뮬레이션 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationProductRequest {
    private Long productId; // 제품 ID
    private Integer dailyDose; // 일일 복용 횟수
}
