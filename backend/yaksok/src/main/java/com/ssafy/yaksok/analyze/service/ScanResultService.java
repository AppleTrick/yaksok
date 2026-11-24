package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse.CandidateInfo;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse.ReportData;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse.ReportProductInfo;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/** ONNX 서버가 준 후보 이름을 DB 제품과 잇는다. 확정은 사용자가 화면에서 한다. */
@Service
@RequiredArgsConstructor
public class ScanResultService {

    private final ProductRepository productRepository;
    private final OcrAnalysisService ocrAnalysisService;

    @Transactional(readOnly = true)
    public SupplementAnalysisResponse toResponse(Long userId, FastApiAnalysisResult ai) {
        List<FastApiAnalysisResult.RawAnalysisResult> found =
                ai.getAnalysisResults() == null ? List.of() : ai.getAnalysisResults();

        List<String> names = found.stream()
                .flatMap(r -> r.candidatesOrEmpty().stream())
                .map(FastApiAnalysisResult.Candidate::getName).distinct().toList();
        // 이름이 같은 제품이 여러 개면 어느 제조사 것인지 알 수 없으므로 먼저 등록된 것을 쓴다
        Map<String, Product> products = names.isEmpty() ? Map.of() : productRepository.findAllByPrdlstNmIn(names).stream()
                .sorted(Comparator.comparing(Product::getId))
                .collect(Collectors.toMap(Product::getPrdlstNm, Function.identity(), (a, b) -> a));

        List<ReportProductInfo> reports = found.stream().map(r -> {
            List<CandidateInfo> candidates = r.candidatesOrEmpty().stream().map(c -> {
                Product p = products.get(c.getName());
                return CandidateInfo.builder()
                        .productId(p == null ? null : p.getId())
                        .name(c.getName()).score(c.getScore())
                        .ingredients(p == null ? List.of() : ocrAnalysisService.ingredientsOf(userId, p))
                        .build();
            }).toList();
            CandidateInfo sure = candidates.stream()
                    .filter(c -> Objects.equals(c.getName(), r.getProductName())).findFirst().orElse(null);
            return ReportProductInfo.builder()
                    .productId(sure == null ? null : sure.getProductId())
                    .name(sure == null ? null : sure.getName())
                    .box(r.getBox()).confidence(r.getConfidence())
                    .ingredients(sure == null ? List.of() : sure.getIngredients())
                    .candidates(candidates).texts(r.getTexts())
                    .build();
        }).toList();

        return SupplementAnalysisResponse.builder()
                .reportData(ReportData.builder().products(reports).build())
                .timings(ai.getTimings())
                .build();
    }
}
