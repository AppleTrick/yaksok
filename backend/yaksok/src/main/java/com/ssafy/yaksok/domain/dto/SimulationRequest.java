package com.ssafy.yaksok.domain.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 시뮬레이션 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationRequest {
    private Long userId;
    private List<SimulationProductRequest> additionalProducts;
}
