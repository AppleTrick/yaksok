package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.internal.AggregatedAnalysisData;
import com.ssafy.yaksok.analyze.dto.internal.AnalysisTarget;
import com.ssafy.yaksok.analyze.dto.response.SupplementAnalysisResponse;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.service.ProductIngredientService;
import com.ssafy.yaksok.product.service.UserProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataAggregator {

    private final ProductIngredientService productIngredientService;
    private final UserProductService userProductService;

    public AggregatedAnalysisData aggregateAnalysisData(Long userId, List<AnalysisTarget> targets) {
        log.info("[AGGREGATOR] 데이터 취합 시작 (Targets Count: {})", targets.size());

        // 1. 매칭된 제품 ID 추출
        List<Long> matchedProductIds = targets.stream()
                .map(AnalysisTarget::getProduct)
                .filter(Objects::nonNull)
                .map(Product::getId)
                .collect(Collectors.toList());

        // 2. 성분 정보 Batch 조회 및 주입
        if (!matchedProductIds.isEmpty()) {
            List<ProductIngredientResponse> ingredientsList = productIngredientService
                    .findIngredientsByProductIds(matchedProductIds);

            Map<Long, List<SupplementAnalysisResponse.ProductIngredientInfo>> ingredientMap = ingredientsList.stream()
                    .collect(Collectors.groupingBy(
                            ProductIngredientResponse::productId,
                            Collectors.mapping(resp -> SupplementAnalysisResponse.ProductIngredientInfo.builder()
                                    .name(resp.name())
                                    .amount(resp.amount() != null ? resp.amount().toString() : "0")
                                    .unit(resp.unit())
                                    .build(), Collectors.toList())));

            targets.forEach(t -> {
                if (t.getProduct() != null) {
                    t.setIngredients(ingredientMap.getOrDefault(t.getProduct().getId(), new ArrayList<>()));
                } else {
                    t.setIngredients(new ArrayList<>());
                }
            });
        } else {
            targets.forEach(t -> t.setIngredients(new ArrayList<>()));
        }

        // 3. 사용자 기존 섭취 정보 조회 (userId가 null이거나 0이면 건너뜀)
        List<UserProductResponse> currentSupplements;
        if (userId != null && userId > 0) {
            log.info("[AGGREGATOR] 📋 사용자 기존 섭취 정보 조회 (userId: {})", userId);
            currentSupplements = userProductService.getUserProducts(userId);
        } else {
            log.info("[AGGREGATOR] 👤 Guest 모드 - 사용자 섭취 정보 조회 건너뜀");
            currentSupplements = new ArrayList<>();
        }

        log.info("[AGGREGATOR] ✅ 데이터 취합 완료: Type A={}개, 기존 섭취={}개",
                matchedProductIds.size(), currentSupplements.size());

        return AggregatedAnalysisData.builder()
                .newTargets(targets)
                .currentSupplements(currentSupplements)
                .build();
    }
}
