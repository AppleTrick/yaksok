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

        return aiResult.getAnalysisResults().parallelStream()
                .map(raw -> {
                    String ocrName = (raw.getOcrTexts() != null && !raw.getOcrTexts().isEmpty())
                            ? raw.getOcrTexts().get(0)
                            : raw.getOcrText();

                    Product product = null;
                    if (ocrName != null && !ocrName.isBlank()) {
                        try {
                            product = productMatchingService.findProduct(ocrName);
                            log.debug("[LINKER] 매칭 성공: {} -> {}", ocrName, product.getPrdlstNm());
                        } catch (Exception e) {
                            log.debug("[LINKER] 매칭 실패 (OCR: {}): {}", ocrName, e.getMessage());
                        }
                    }

                    return AnalysisTarget.builder()
                            .product(product)
                            .ocrName(ocrName)
                            .rawResult(raw)
                            .build();
                })
                .collect(Collectors.toList());
    }
}
