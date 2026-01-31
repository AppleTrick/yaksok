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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

        private final AiGateway aiGateway;
        private final ProductLinker productLinker;
        private final DataAggregator dataAggregator;
        private final LlmAnalyzer llmAnalyzer;
        private final ObjectMapper objectMapper = new ObjectMapper()
                        .enable(SerializationFeature.INDENT_OUTPUT);

        /**
         * 영양제 이미지 분석 실행 메인 로직 (Facade)
         */
        public SupplementAnalysisResponse analyzeSupplement(Long userId, MultipartFile file) {
                log.info("╔══════════════════════════════════════════════════════════════╗");
                log.info("║       🚀 영양제 분석 파이프라인 시작 (Modular Pipeline)        ║");
                log.info("╚══════════════════════════════════════════════════════════════╝");
                log.info("[PIPELINE] 📁 파일: {}, 👤 userId: {}",
                                file != null ? file.getOriginalFilename() : "null",
                                userId != null ? userId : "Guest");

                long pipelineStart = System.currentTimeMillis();

                try {
                        // ════════════════════════════════════════════════════════════
                        // STEP 1: AI Gateway - FastAPI 호출 (YOLO + OCR)
                        // ════════════════════════════════════════════════════════════
                        log.info("┌─────────────────────────────────────────────────────────────");
                        log.info("│ [STEP 1] 🤖 AI Gateway 호출 시작");
                        long step1Start = System.currentTimeMillis();

                        FastApiAnalysisResult aiResult = aiGateway.callAiServer(file);

                        long step1Elapsed = System.currentTimeMillis() - step1Start;
                        int objectCount = aiResult != null && aiResult.getAnalysisResults() != null
                                        ? aiResult.getAnalysisResults().size()
                                        : 0;
                        log.info("│ [STEP 1] ✅ 완료 - {}개 객체 탐지 ({}ms)", objectCount, step1Elapsed);
                        log.info("└─────────────────────────────────────────────────────────────");

                        // ════════════════════════════════════════════════════════════
                        // STEP 2: Product Linker - DB 매칭 (4-Stage Pipeline)
                        // ════════════════════════════════════════════════════════════
                        log.info("┌─────────────────────────────────────────────────────────────");
                        log.info("│ [STEP 2] 🔗 Product Linker 시작");
                        long step2Start = System.currentTimeMillis();

                        List<AnalysisTarget> targets = productLinker.linkProducts(aiResult);

                        long step2Elapsed = System.currentTimeMillis() - step2Start;
                        String matchSummary = targets.stream()
                                        .map(t -> (t.getProduct() != null ? "✅" : "❌") + t.getOcrName())
                                        .collect(Collectors.joining(", "));
                        log.info("│ [STEP 2] 매칭 결과: [{}]", matchSummary);
                        log.info("│ [STEP 2] ✅ 완료 - {}개 타겟 ({}ms)", targets.size(), step2Elapsed);
                        log.info("└─────────────────────────────────────────────────────────────");

                        // 2-1. Early Return: 탐지된 제품이 없으면 LLM 호출 생략
                        if (targets.isEmpty()) {
                                log.warn("[PIPELINE] ⚠️ 탐지된 제품이 없습니다. 조기 리턴합니다.");
                                return assembleEmptyResponse();
                        }

                        // ════════════════════════════════════════════════════════════
                        // STEP 3: Data Aggregator - 데이터 취합
                        // ════════════════════════════════════════════════════════════
                        log.info("┌─────────────────────────────────────────────────────────────");
                        log.info("│ [STEP 3] 📊 Data Aggregator 시작 (userId: {})",
                                        userId != null && userId > 0 ? userId : "Guest");
                        long step3Start = System.currentTimeMillis();

                        AggregatedAnalysisData aggregatedData = dataAggregator.aggregateAnalysisData(userId, targets);

                        long step3Elapsed = System.currentTimeMillis() - step3Start;
                        long typeACount = targets.stream().filter(t -> t.getProduct() != null).count();
                        long typeBCount = targets.size() - typeACount;
                        log.info("│ [STEP 3] LLM 전달 데이터: Type A={}개, Type B={}개, 기존 섭취={}개",
                                        typeACount, typeBCount, aggregatedData.getCurrentSupplements().size());
                        log.info("│ [STEP 3] ✅ 완료 ({}ms)", step3Elapsed);
                        log.info("└─────────────────────────────────────────────────────────────");

                        // ════════════════════════════════════════════════════════════
                        // STEP 4: LLM Analyzer - 상세 분석
                        // ════════════════════════════════════════════════════════════
                        log.info("┌─────────────────────────────────────────────────────────────");
                        log.info("│ [STEP 4] 🧠 LLM Analyzer 시작");
                        long step4Start = System.currentTimeMillis();

                        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis = llmAnalyzer
                                        .performLlmAnalysis(aggregatedData);

                        long step4Elapsed = System.currentTimeMillis() - step4Start;
                        log.info("│ [STEP 4] ✅ LLM 분석 완료 ({}ms)", step4Elapsed);
                        log.info("└─────────────────────────────────────────────────────────────");

                        // ════════════════════════════════════════════════════════════
                        // STEP 5: Final Result - 응답 조립
                        // ════════════════════════════════════════════════════════════
                        SupplementAnalysisResponse response = assembleUnifiedResponse(targets, overdoseAnalysis);

                        long totalElapsed = System.currentTimeMillis() - pipelineStart;
                        log.info("╔══════════════════════════════════════════════════════════════╗");
                        log.info("║  ✅ 파이프라인 완료 - 총 소요시간: {}ms                      ║", totalElapsed);
                        log.info("║  📊 Step1(AI): {}ms, Step2(Link): {}ms, Step3(Agg): {}ms, Step4(LLM): {}ms ║",
                                        step1Elapsed, step2Elapsed, step3Elapsed, step4Elapsed);
                        log.info("╚══════════════════════════════════════════════════════════════╝");

                        return response;

                } catch (AnalyzeException e) {
                        log.error("[Pipeline Failure] ❌ Stage: {}, Message: {}", e.getStage(), e.getMessage());
                        throw e;
                } catch (Exception e) {
                        log.error("[Pipeline Failure] ❌ Unexpected System Error", e);
                        throw new AnalyzeException(ErrorCode.INTERNAL_SERVER_ERROR, "ORCHESTRATOR", e.getMessage());
                }
        }

        private SupplementAnalysisResponse assembleUnifiedResponse(List<AnalysisTarget> targets,
                        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis) {
                log.info("[ASSEMBLER] 최종 응답 조립 시작");

                // ═══════════════════════════════════════════════════════════════
                // LLM 추론 제품명 맵 생성 (Type B 이름 보정용)
                // ═══════════════════════════════════════════════════════════════
                Map<String, String> llmInferredNames = new HashMap<>();
                if (overdoseAnalysis != null && overdoseAnalysis.getDetectedProducts() != null) {
                        for (var dp : overdoseAnalysis.getDetectedProducts()) {
                                if (dp.getOcrHint() != null && dp.getInferredName() != null) {
                                        llmInferredNames.put(dp.getOcrHint(), dp.getInferredName());
                                }
                        }
                        log.info("[ASSEMBLER] 📦 LLM 추론 제품명 맵: {}", llmInferredNames);
                }

                List<SupplementAnalysisResponse.ProductDisplayInfo> productDisplayInfos = new ArrayList<>();
                List<SupplementAnalysisResponse.ReportProductInfo> reportProductInfos = new ArrayList<>();

                for (int i = 0; i < targets.size(); i++) {
                        AnalysisTarget t = targets.get(i);
                        long tempId = (long) i + 1;

                        // ═══════════════════════════════════════════════════════════════
                        // DB 매칭 실패 시 LLM 추론 이름으로 대체
                        // ═══════════════════════════════════════════════════════════════
                        String displayName = t.getName();
                        if (t.getProduct() == null) {
                                // ocrName에서 LLM 추론 이름 찾기
                                String llmName = llmInferredNames.get(t.getOcrName());
                                if (llmName != null && !llmName.isBlank()) {
                                        displayName = llmName + " (추정)";
                                        log.info("[ASSEMBLER] 🔄 이름 보정: '{}' → '{}'", t.getOcrName(), displayName);
                                }
                        }

                        productDisplayInfos.add(SupplementAnalysisResponse.ProductDisplayInfo.builder()
                                        .tempId(tempId)
                                        .name(displayName)
                                        .confidence(t.getRawResult().getConfidence())
                                        .box(t.getRawResult().getBox())
                                        .isExactMatch(t.getProduct() != null)
                                        .build());

                        reportProductInfos.add(SupplementAnalysisResponse.ReportProductInfo.builder()
                                        .productId(t.getProduct() != null ? t.getProduct().getId() : null)
                                        .name(displayName)
                                        .confidence(t.getRawResult().getConfidence())
                                        .ingredients(t.getIngredients())
                                        .build());
                }

                SupplementAnalysisResponse response = SupplementAnalysisResponse.builder()
                                .displayData(SupplementAnalysisResponse.DisplayData.builder()
                                                .objectCount(targets.size())
                                                .products(productDisplayInfos)
                                                .build())
                                .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                .products(reportProductInfos)
                                                .overdoseAnalysis(overdoseAnalysis)
                                                .build())
                                .build();

                // ═══════════════════════════════════════════════════════════════
                // 최종 응답 JSON 로깅 (프론트엔드 전달 데이터 확인용)
                // ═══════════════════════════════════════════════════════════════
                try {
                        String jsonResponse = objectMapper.writeValueAsString(response);
                        log.info("[FINAL_RESPONSE] ═══════════════════════════════════════════");
                        log.info("{}", jsonResponse);
                        log.info("═══════════════════════════════════════════════════════════════");
                } catch (Exception e) {
                        log.warn("[FINAL_RESPONSE] JSON 직렬화 실패: {}", e.getMessage());
                }

                return response;
        }

        /**
         * 탐지된 제품이 없을 때 빈 응답 생성
         */
        private SupplementAnalysisResponse assembleEmptyResponse() {
                return SupplementAnalysisResponse.builder()
                                .displayData(SupplementAnalysisResponse.DisplayData.builder()
                                                .objectCount(0)
                                                .products(new ArrayList<>())
                                                .build())
                                .reportData(SupplementAnalysisResponse.ReportData.builder()
                                                .products(new ArrayList<>())
                                                .overdoseAnalysis(null)
                                                .build())
                                .build();
        }
}
