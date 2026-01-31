package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.internal.AnalysisTarget;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.service.ProductMatchingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductLinker {

    private final ProductMatchingService productMatchingService;

    public List<AnalysisTarget> linkProducts(FastApiAnalysisResult aiResult) {
        log.info("[LINKER] 제품 매칭 시작 (Parallel)");

        if (aiResult == null || aiResult.getAnalysisResults() == null) {
            return new ArrayList<>();
        }

        // 개별 제품 매칭 실패 시 try-catch로 처리되므로 병렬 스트림 사용 가능
        return aiResult.getAnalysisResults().parallelStream()
                .map(raw -> {
                    String ocrName = (raw.getOcrTexts() != null && !raw.getOcrTexts().isEmpty())
                            ? raw.getOcrTexts().get(0)
                            : raw.getOcrText();

                    try {
                        Product product = null;
                        if (ocrName != null && !ocrName.isBlank()) {
                            product = productMatchingService.findProduct(ocrName);
                            if (product != null) {
                                log.debug("[LINKER] 매칭 성공: {} -> {}", ocrName, product.getPrdlstNm());
                            }
                        }

                        return AnalysisTarget.builder()
                                .product(product)
                                .ocrName(ocrName)
                                .rawResult(raw)
                                .build();
                    } catch (Exception e) {
                        log.error("[LINKER] 개별 제품 매칭 중 오류 발생 (무시하고 계속): {}", e.getMessage());
                        return AnalysisTarget.builder()
                                .ocrName(ocrName)
                                .rawResult(raw)
                                .build();
                    }
                })
                .collect(Collectors.toList());
    }
}
