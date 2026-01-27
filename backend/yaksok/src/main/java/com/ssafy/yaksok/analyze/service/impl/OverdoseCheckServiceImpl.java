package com.ssafy.yaksok.analyze.service.impl;

import com.ssafy.yaksok.analyze.domain.dto.IngredientOverdoseResult;
import com.ssafy.yaksok.analyze.domain.dto.IngredientSummary;
import com.ssafy.yaksok.analyze.domain.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.analyze.domain.dto.SimulationProductRequest;
import com.ssafy.yaksok.analyze.repository.UserProductRepository;
import com.ssafy.yaksok.analyze.service.OverdoseCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 과복용 체크 서비스 구현체
 * 
 * 로직:
 * 1. user_product에서 사용자의 모든 활성 복용 정보 조회
 * 2. 성분별로 (복용횟수 × 복용량 × 성분함량) 합산
 * 3. 각 성분별 max_intake_value와 비교하여 과복용 판단
 * 4. 성분별 boolean 결과 반환
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OverdoseCheckServiceImpl implements OverdoseCheckService {

    private final UserProductRepository userProductRepository;

    @Override
    public OverdoseCheckResponse checkOverdose(Long userId) {
        // 1. 사용자의 성분별 합산량 조회
        List<IngredientSummary> summaries = userProductRepository.findIngredientSummaryByUserId(userId);

        // 2. 과복용 판단 및 응답 생성
        return buildOverdoseResponse(userId, summaries);
    }

    @Override
    public OverdoseCheckResponse checkOverdoseWithSimulation(Long userId,
            List<SimulationProductRequest> additionalProducts) {
        // 1. 기존 DB에서 성분 합산 (Map으로 변환)
        List<IngredientSummary> dbSummaries = userProductRepository.findIngredientSummaryByUserId(userId);

        Map<Long, IngredientSummary> mergedMap = new HashMap<>();
        for (IngredientSummary s : dbSummaries) {
            mergedMap.put(s.getIngredientId(), s);
        }

        // 2. 추가 제품 성분 조회 및 병합
        for (SimulationProductRequest product : additionalProducts) {
            List<IngredientSummary> productSummaries = userProductRepository.findIngredientsByProductId(
                    product.getProductId(),
                    product.getDailyDose());

            for (IngredientSummary ps : productSummaries) {
                if (mergedMap.containsKey(ps.getIngredientId())) {
                    // 기존 성분에 추가
                    IngredientSummary existing = mergedMap.get(ps.getIngredientId());
                    BigDecimal newTotal = existing.getTotalAmount().add(ps.getTotalAmount());
                    existing.setTotalAmount(newTotal);
                } else {
                    // 새 성분 추가
                    mergedMap.put(ps.getIngredientId(), ps);
                }
            }
        }

        // 3. 과복용 판단 및 응답 생성
        return buildOverdoseResponse(userId, new ArrayList<>(mergedMap.values()));
    }

    /**
     * 성분 목록을 기반으로 과복용 응답 생성
     */
    private OverdoseCheckResponse buildOverdoseResponse(Long userId, List<IngredientSummary> summaries) {
        List<IngredientOverdoseResult> results = new ArrayList<>();
        int overdoseCount = 0;

        for (IngredientSummary summary : summaries) {
            boolean isOverdose = false;

            // max_intake_value가 있는 경우에만 과복용 판단
            if (summary.getMaxIntakeValue() != null && summary.getTotalAmount() != null) {
                isOverdose = summary.getTotalAmount().compareTo(summary.getMaxIntakeValue()) > 0;
            }

            if (isOverdose) {
                overdoseCount++;
            }

            IngredientOverdoseResult result = IngredientOverdoseResult.builder()
                    .ingredientId(summary.getIngredientId())
                    .ingredientName(summary.getIngredientName())
                    .totalAmount(summary.getTotalAmount())
                    .maxIntakeValue(summary.getMaxIntakeValue())
                    .unit(summary.getUnit())
                    .isOverdose(isOverdose)
                    .build();

            results.add(result);
        }

        return OverdoseCheckResponse.builder()
                .userId(userId)
                .hasAnyOverdose(overdoseCount > 0)
                .overdoseCount(overdoseCount)
                .totalIngredientCount(results.size())
                .results(results)
                .build();
    }
}
