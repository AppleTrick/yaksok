package com.ssafy.yaksok.analyze.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse;
import com.ssafy.yaksok.global.llm.service.LLMService;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.service.ProductMatchingService;
import com.ssafy.yaksok.product.service.UserProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 영양제 이미지 분석 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

        private final WebClient.Builder webClientBuilder;
        private final ProductMatchingService productMatchingService;
        private final UserProductService userProductService;
        private final LLMService llmService;

        @Value("${fastapi.url}")
        private String fastApiUrl;

        /**
         * 영양제 이미지 분석 실행 메인 로직
         */
        public SupplementAnalysisResponse analyzeSupplement(Long userId, MultipartFile file) {
                log.info("영양제 분석 요청 시작: userId={}, filename={}", userId, file.getOriginalFilename());

                // 1. FastAPI 호출 (AI 분석 요청)
                FastApiAnalysisResult aiResult = callFastApi(file);

                // 2. 결과 결합 및 통합 응답(Display + Report) 생성
                return buildUnifiedResponse(userId, aiResult);
        }

        /**
         * AI 서버(FastAPI)와 통신하여 이미지 분석 결과를 받아옵니다.
         */
        private FastApiAnalysisResult callFastApi(MultipartFile file) {
                try {
                        WebClient webClient = webClientBuilder.build();

                        MultipartBodyBuilder builder = new MultipartBodyBuilder();
                        builder.part("file", new ByteArrayResource(file.getBytes()))
                                        .filename(file.getOriginalFilename())
                                        .contentType(MediaType.IMAGE_JPEG);

                        FastApiAnalysisResult result = webClient.post()
                                        .uri(fastApiUrl)
                                        .contentType(MediaType.MULTIPART_FORM_DATA)
                                        .body(BodyInserters.fromMultipartData(builder.build()))
                                        .retrieve()
                                        .bodyToMono(FastApiAnalysisResult.class)
                                        .block();

                        logAiAnalysisDetails(result);
                        return result;

                } catch (IOException e) {
                        log.error("파일 처리 실패", e);
                        throw new RuntimeException("이미지 파일 처리 중 오류가 발생했습니다.");
                } catch (Exception e) {
                        log.error("AI 서버 통신 실패", e);
                        throw new RuntimeException("AI 분석 서버와의 네트워크 통신에 실패했습니다.");
                }
        }

        private void logAiAnalysisDetails(FastApiAnalysisResult result) {
                if (result == null || result.getAnalysisResults() == null)
                        return;

                log.info("============== AI 분석 결과 상세 로그 ==============");
                result.getAnalysisResults().forEach(raw -> {
                        log.info("Conf: {}, Product: {}, OCR: {}",
                                        raw.getConfidence(),
                                        raw.getProductName(),
                                        raw.getOcrText() != null
                                                        ? raw.getOcrText().substring(0,
                                                                        Math.min(raw.getOcrText().length(), 20)) + "..."
                                                        : "Empty");
                });
                log.info("================================================");
        }

        /**
         * AI 분석 결과(FastAPI)와 비즈니스 데이터를 결합하여 최종 응답 객체를 생성합니다.
         */
        private SupplementAnalysisResponse buildUnifiedResponse(Long userId, FastApiAnalysisResult aiResult) {
                // 1. 화면 표시용 데이터(DisplayData) - Pass-through Logic
                List<SupplementAnalysisResponse.ProductDisplayInfo> displayProducts = new ArrayList<>();

                if (aiResult != null && aiResult.isSuccess() && aiResult.getAnalysisResults() != null) {
                        for (FastApiAnalysisResult.RawAnalysisResult raw : aiResult.getAnalysisResults()) {
                                displayProducts.add(SupplementAnalysisResponse.ProductDisplayInfo.builder()
                                                .tempId(null) // 매칭 안함
                                                .name(raw.getProductName() != null ? raw.getProductName() : "이름 없음")
                                                .barcode(null) // raw.getOcrText() 사용 안함
                                                .confidence(raw.getConfidence())
                                                .box(raw.getBox())
                                                .isExactMatch(false)
                                                .build());
                        }
                }

                SupplementAnalysisResponse.DisplayData displayData = SupplementAnalysisResponse.DisplayData.builder()
                                .objectCount(displayProducts.size())
                                .products(displayProducts)
                                .build();

                // 2. 분석 리포트 데이터(ReportData) - Empty Return (Simplified)
                SupplementAnalysisResponse.ReportData reportData = SupplementAnalysisResponse.ReportData.builder()
                                .products(new ArrayList<>())
                                .overdoseAnalysis(createEmptyOverdoseAnalysis())
                                .build();

                return SupplementAnalysisResponse.builder()
                                .displayData(displayData)
                                .reportData(reportData)
                                .build();
        }

        // generateRealReportData 메서드는 더 이상 사용하지 않음
        // generateLLMReport 메서드는 더 이상 사용하지 않음

        private SupplementAnalysisResponse.OverdoseAnalysis generateLLMReport(
                        List<Product> matchedProducts,
                        List<UserProductResponse> currentSupplements) {

                // 프롬프트 구성
                StringBuilder prompt = new StringBuilder();
                prompt.append("당신은 전문 영양사입니다. 다음 영양제 정보를 바탕으로 과복용 분석 및 권장사항 리포트를 작성해주세요.\n\n");

                prompt.append("[새로 분석된 영양제]\n");
                matchedProducts.forEach(p -> prompt.append("- ").append(p.getPrdlstNm()).append("\n"));

                prompt.append("\n[현재 복용 중인 영양제]\n");
                currentSupplements.forEach(s -> prompt.append("- ").append(s.getProductName()).append("\n"));

                prompt.append("\n위 영양제들을 함께 복용했을 때:\n");
                prompt.append("1. 성분 중복이나 과복용 위험이 있는 요소\n");
                prompt.append("2. 함께 먹으면 좋은 궁합 또는 피해야 할 궁합\n");
                prompt.append("3. 일일 권장 섭취량 대비 현재 상태\n\n");

                prompt.append("다음 JSON 형식으로만 응답해주세요:\n");
                prompt.append("{\n");
                prompt.append("  \"comparison\": [\n");
                prompt.append("    { \"name\": \"성분명\", \"myAmount\": \"복용중양\", \"newAmount\": \"신규양\", \"totalAmount\": \"합계\", \"status\": \"good|warning|new\" }\n");
                prompt.append("  ],\n");
                prompt.append("  \"recommendations\": {\n");
                prompt.append("    \"interactions\": [ { \"type\": \"tip|warning\", \"text\": \"설명\" } ],\n");
                prompt.append("    \"dosageInfo\": [ { \"name\": \"성분명\", \"min\": \"최소\", \"recommended\": \"권장\", \"max\": \"최대\", \"current\": \"현재\", \"status\": \"good|warning\" } ],\n");
                prompt.append("    \"productNotes\": [ \"제품 특이사항\" ]\n");
                prompt.append("  }\n");
                prompt.append("}\n");

                try {
                        String response = llmService.query(prompt.toString(), 0.5);
                        // JSON 파싱 로직 (간소화 위해 Jackson 사용 가능)
                        ObjectMapper mapper = new ObjectMapper();
                        String cleanJson = response.replaceAll("```json|```", "").trim();
                        return mapper.readValue(cleanJson, SupplementAnalysisResponse.OverdoseAnalysis.class);
                } catch (Exception e) {
                        log.error("LLM 리포트 생성 실패", e);
                        return createEmptyOverdoseAnalysis();
                }
        }

        private SupplementAnalysisResponse.OverdoseAnalysis createEmptyOverdoseAnalysis() {
                return SupplementAnalysisResponse.OverdoseAnalysis.builder()
                                .comparison(new ArrayList<>())
                                .recommendations(SupplementAnalysisResponse.Recommendations.builder()
                                                .interactions(new ArrayList<>())
                                                .dosageInfo(new ArrayList<>())
                                                .productNotes(List.of("리포트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."))
                                                .build())
                                .build();
        }
}
