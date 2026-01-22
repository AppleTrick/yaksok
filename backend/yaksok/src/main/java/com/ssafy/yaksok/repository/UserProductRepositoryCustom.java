package com.ssafy.yaksok.repository;

import com.ssafy.yaksok.domain.dto.IngredientSummary;

import java.util.List;

/**
 * UserProduct QueryDSL Custom Repository 인터페이스
 */
public interface UserProductRepositoryCustom {

    /**
     * 사용자의 성분별 일일 섭취량 합산 조회
     * 계산: ingredient_amount × daily_dose × dose_amount (dose_amount가 null이면 1로 처리)
     */
    List<IngredientSummary> findIngredientSummaryByUserId(Long userId);

    /**
     * 특정 제품의 성분 목록 조회 (시뮬레이션용)
     */
    List<IngredientSummary> findIngredientsByProductId(Long productId, Integer dailyDose);
}
