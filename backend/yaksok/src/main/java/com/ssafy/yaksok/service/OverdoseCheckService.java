package com.ssafy.yaksok.service;

import com.ssafy.yaksok.domain.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.domain.dto.SimulationProductRequest;

import java.util.List;

/**
 * 과복용 체크 서비스 인터페이스
 */
public interface OverdoseCheckService {

    /**
     * 사용자의 모든 복용 정보 조회 후 성분별 과복용 여부 판단
     * 
     * @param userId 사용자 ID
     * @return 성분별 과복용 boolean 결과
     */
    OverdoseCheckResponse checkOverdose(Long userId);

    /**
     * 기존 복용 정보 + 추가 제품을 함께 계산하여 과복용 시뮬레이션
     * 
     * @param userId             사용자 ID
     * @param additionalProducts 추가할 제품 목록
     * @return 성분별 과복용 boolean 결과
     */
    OverdoseCheckResponse checkOverdoseWithSimulation(Long userId, List<SimulationProductRequest> additionalProducts);
}
