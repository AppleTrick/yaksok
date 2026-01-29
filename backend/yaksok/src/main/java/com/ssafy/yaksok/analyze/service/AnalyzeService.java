package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse;
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
import java.util.Arrays;
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

        @Value("${fastapi.url}")
        private String fastApiUrl;

        // ========================================================================
        // [MOCK DATA 전용 상수] - 실제 데이터 연동 전까지 화면 개발을 위해 사용합니다.
        // ========================================================================
        private static final String MOCK_PRODUCT_VITAMIN = "내츄럴웨이 고함량 비타민 D3 2000IU";
        private static final String MOCK_PRODUCT_ZINC = "파워에너지 징크 아연 플러스 15mg";
        private static final String STATUS_WARNING = "warning";
        private static final String STATUS_GOOD = "good";

        /**
         * 영양제 이미지 분석 실행 메인 로직
         */
        public SupplementAnalysisResponse analyzeSupplement(MultipartFile file) {
                log.info("영양제 분석 요청 시작: filename={}", file.getOriginalFilename());

                // 1. FastAPI 호출 (AI 분석 요청)
                FastApiAnalysisResult aiResult = callFastApi(file);

                // 2. 결과 결합 및 통합 응답(Display + Report) 생성
                return buildUnifiedResponse(aiResult);
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
                        log.info("Conf: {}, Barcode: {}, OCR: {}",
                                        raw.getConfidence(),
                                        raw.getBarcode() != null ? raw.getBarcode() : "N/A",
                                        raw.getOcrTexts());
                });
                log.info("================================================");
        }

        /**
         * AI 분석 결과(FastAPI)와 비즈니스/Mock 데이터를 결합하여 최종 응답 객체를 생성합니다.
         */
        private SupplementAnalysisResponse buildUnifiedResponse(FastApiAnalysisResult aiResult) {
                // 1. 화면 표시용 데이터(DisplayData) 구성
                List<SupplementAnalysisResponse.ProductDisplayInfo> displayProducts = new ArrayList<>();

                if (aiResult != null && aiResult.getAnalysisResults() != null) {
                        long tempId = 1000;
                        for (FastApiAnalysisResult.RawAnalysisResult raw : aiResult.getAnalysisResults()) {
                                String name = (raw.getOcrTexts() != null && !raw.getOcrTexts().isEmpty())
                                                ? raw.getOcrTexts().get(0)
                                                : "인식된 제품";

                                displayProducts.add(SupplementAnalysisResponse.ProductDisplayInfo.builder()
                                                .tempId(++tempId)
                                                .name(name)
                                                .barcode(raw.getBarcode())
                                                .confidence(raw.getConfidence())
                                                .box(raw.getBox())
                                                .isExactMatch(raw.getBarcode() != null)
                                                .build());
                        }
                }

                SupplementAnalysisResponse.DisplayData displayData = SupplementAnalysisResponse.DisplayData.builder()
                                .objectCount(displayProducts.size())
                                .products(displayProducts)
                                .build();

                // 2. 분석 리포트 데이터(ReportData) 구성 - 현재는 Mock 사용
                // FIXME: 추후 DB 연동 시 바코드 기반 검색 및 유저 맞춤 분석 로직으로 대체
                SupplementAnalysisResponse.ReportData reportData = buildMockReportData(displayProducts);

                return SupplementAnalysisResponse.builder()
                                .displayData(displayData)
                                .reportData(reportData)
                                .build();
        }

        private SupplementAnalysisResponse.ReportData buildMockReportData(
                        List<SupplementAnalysisResponse.ProductDisplayInfo> products) {
                // 제품 상세 정보 생성
                List<SupplementAnalysisResponse.ReportProductInfo> reportProducts = products.stream()
                                .map(p -> SupplementAnalysisResponse.ReportProductInfo.builder()
                                                .productId(p.getTempId())
                                                .name(p.getName())
                                                .confidence(p.getConfidence())
                                                .ingredients(createMockIngredients())
                                                .build())
                                .collect(Collectors.toList());

                // 과복용 분석 정보 생성
                SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis = createMockOverdoseAnalysis();

                return SupplementAnalysisResponse.ReportData.builder()
                                .products(reportProducts)
                                .overdoseAnalysis(overdoseAnalysis)
                                .build();
        }

        private List<SupplementAnalysisResponse.ProductIngredientInfo> createMockIngredients() {
                return Arrays.asList(
                                createIngredient(MOCK_PRODUCT_VITAMIN, "1000", "IU", 250),
                                createIngredient(MOCK_PRODUCT_ZINC, "10", "mg", 85));
        }

        private SupplementAnalysisResponse.ProductIngredientInfo createIngredient(String n, String a, String u, int d) {
                return SupplementAnalysisResponse.ProductIngredientInfo.builder()
                                .name(n).amount(a).unit(u).dailyPercent(d).build();
        }

        private SupplementAnalysisResponse.OverdoseAnalysis createMockOverdoseAnalysis() {
                return SupplementAnalysisResponse.OverdoseAnalysis.builder()
                                .comparison(Arrays.asList(
                                                createComparison(MOCK_PRODUCT_VITAMIN, "800IU", "1000IU", "1800IU",
                                                                STATUS_WARNING),
                                                createComparison(MOCK_PRODUCT_ZINC, "0mg", "10mg", "10mg",
                                                                STATUS_GOOD)))
                                .recommendations(SupplementAnalysisResponse.Recommendations.builder()
                                                .interactions(List.of(
                                                                SupplementAnalysisResponse.InteractionInfo.builder()
                                                                                .type("tip").text("식사 직후 섭취가 좋습니다.")
                                                                                .build()))
                                                .dosageInfo(List.of(
                                                                SupplementAnalysisResponse.DosageInfo.builder()
                                                                                .name(MOCK_PRODUCT_VITAMIN).min("400IU")
                                                                                .recommended("800IU").max("4000IU")
                                                                                .current("1800IU")
                                                                                .status(STATUS_WARNING).build()))
                                                .productNotes(List.of(MOCK_PRODUCT_VITAMIN + " 함량이 높으니 주의하세요."))
                                                .build())
                                .build();
        }

        private SupplementAnalysisResponse.ComparisonResult createComparison(String n, String m, String nw, String t,
                        String s) {
                return SupplementAnalysisResponse.ComparisonResult.builder()
                                .name(n).myAmount(m).newAmount(nw).totalAmount(t).status(s).build();
        }
}
