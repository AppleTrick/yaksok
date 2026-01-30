package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.internal.AggregatedAnalysisData;
import com.ssafy.yaksok.analyze.dto.internal.AnalysisTarget;
import com.ssafy.yaksok.analyze.dto.response.SupplementAnalysisResponse;
import com.ssafy.yaksok.analyze.exception.AnalyzeException;
import com.ssafy.yaksok.analyze.gateway.AiGateway;
import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

        private final AiGateway aiGateway;
        private final ProductLinker productLinker;
        private final DataAggregator dataAggregator;
        private final LlmAnalyzer llmAnalyzer;

        /**
         * 영양제 이미지 분석 실행 메인 로직 (Facade)
         */
        public SupplementAnalysisResponse analyzeSupplement(Long userId, MultipartFile file) {
                log.info("=== 영양제 분석 파이프라인 시작 (Modular) ===");

                try {
                        // 1. AI Gateway: FastAPI 호출
                        FastApiAnalysisResult aiResult = aiGateway.callAiServer(file);

                        // 2. Product Linker: DB 매칭
                        List<AnalysisTarget> targets = productLinker.linkProducts(aiResult);

                        // 3. Data Aggregator: 데이터 취합
                        AggregatedAnalysisData aggregatedData = dataAggregator.aggregateAnalysisData(userId, targets);

                        // 4. LLM Analyzer: 상세 분석
                        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis = llmAnalyzer
                                        .performLlmAnalysis(aggregatedData);

                        // 5. Final Result: 응답 조립
                        return assembleUnifiedResponse(targets, overdoseAnalysis);

                } catch (AnalyzeException e) {
                        log.error("[Pipeline Failure] Stage: {}, Message: {}", e.getStage(), e.getMessage());
                        throw e;
                } catch (Exception e) {
                        log.error("[Pipeline Failure] Unexpected System Error", e);
                        throw new AnalyzeException(ErrorCode.INTERNAL_SERVER_ERROR, "ORCHESTRATOR", e.getMessage());
                }
        }

        private SupplementAnalysisResponse assembleUnifiedResponse(List<AnalysisTarget> targets,
                        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis) {
                log.info("[ASSEMBLER] 최종 응답 조립 시작");

                List<SupplementAnalysisResponse.ProductDisplayInfo> productDisplayInfos = new ArrayList<>();
                List<SupplementAnalysisResponse.ReportProductInfo> reportProductInfos = new ArrayList<>();

                for (int i = 0; i < targets.size(); i++) {
                        AnalysisTarget t = targets.get(i);
                        long tempId = (long) i + 1;

                        productDisplayInfos.add(SupplementAnalysisResponse.ProductDisplayInfo.builder()
                                        .tempId(tempId)
                                        .name(t.getName())
                                        .confidence(t.getRawResult().getConfidence())
                                        .box(t.getRawResult().getBox())
                                        .isExactMatch(t.getProduct() != null)
                                        .build());

                        reportProductInfos.add(SupplementAnalysisResponse.ReportProductInfo.builder()
                                        .productId(t.getProduct() != null ? t.getProduct().getId() : null)
                                        .name(t.getName())
                                        .confidence(t.getRawResult().getConfidence())
                                        .ingredients(t.getIngredients())
                                        .build());
                }

                return SupplementAnalysisResponse.builder()
                                .displayData(SupplementAnalysisResponse.DisplayData.builder()
                                                .objectCount(targets.size())
                                                .products(productDisplayInfos)
                                                .build())
                                .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                .products(reportProductInfos)
                                                .overdoseAnalysis(overdoseAnalysis)
                                                .build())
                                .build();
        }
}
