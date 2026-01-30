package com.ssafy.yaksok.analyze.dto.internal;

import com.ssafy.yaksok.product.dto.UserProductResponse;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class AggregatedAnalysisData {
    private final List<AnalysisTarget> newTargets;
    private final List<UserProductResponse> currentSupplements;
}
