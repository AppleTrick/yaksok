package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.IngredientOverdoseResult;
import com.ssafy.yaksok.analyze.dto.IngredientSummary;
import com.ssafy.yaksok.analyze.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.analyze.dto.SimulationProductRequest;
import com.ssafy.yaksok.analyze.repository.OverdoseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 과복용 체크 서비스 구현체
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OverdoseCheckService {

    private final OverdoseRepository overdoseRepository;

    public OverdoseCheckResponse checkOverdose(Long userId) {
        List<IngredientSummary> summaries = overdoseRepository.findIngredientSummaryByUserId(userId);
        return buildOverdoseResponse(userId, summaries);
    }

    public OverdoseCheckResponse checkOverdoseWithaddProduct(Long userId,
            List<SimulationProductRequest> additionalProducts) {
        List<IngredientSummary> dbSummaries = overdoseRepository.findIngredientSummaryByUserId(userId);

        Map<Long, IngredientSummary> mergedMap = new HashMap<>();
        for (IngredientSummary s : dbSummaries) {
            mergedMap.put(s.getIngredientId(), s);
        }

        for (SimulationProductRequest product : additionalProducts) {
            List<IngredientSummary> productSummaries = overdoseRepository.findIngredientsByProductId(
                    product.getProductId(),
                    product.getDailyDose());

            for (IngredientSummary ps : productSummaries) {
                if (mergedMap.containsKey(ps.getIngredientId())) {
                    IngredientSummary existing = mergedMap.get(ps.getIngredientId());
                    Double newTotal = existing.getTotalAmount() + ps.getTotalAmount();
                    existing.setTotalAmount(newTotal);
                } else {
                    mergedMap.put(ps.getIngredientId(), ps);
                }
            }
        }

        return buildOverdoseResponse(userId, new ArrayList<>(mergedMap.values()));
    }

    private OverdoseCheckResponse buildOverdoseResponse(Long userId, List<IngredientSummary> summaries) {
        List<IngredientOverdoseResult> results = new ArrayList<>();
        int overdoseCount = 0;

        for (IngredientSummary summary : summaries) {
            boolean isOverdose = false;

            if (summary.getMaxIntakeValue() != null && summary.getTotalAmount() != null) {
                isOverdose = summary.getTotalAmount() > summary.getMaxIntakeValue();
            }

            if (isOverdose) {
                overdoseCount++;
            }

            IngredientOverdoseResult result = IngredientOverdoseResult.builder()
                    .ingredientId(summary.getIngredientId())
                    .ingredientName(summary.getIngredientName())
                    .totalAmount(summary.getTotalAmount())
                    .maxIntakeValue(summary.getMaxIntakeValue())
                    .minIntakeValue(summary.getMinIntakeValue())
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
