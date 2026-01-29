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
 * 
 * FastAPI(AI 서버)와 통신하여 이미지를 분석하고,
 * 그 결과를 바탕으로 리포트용 데이터를 구성(Mock 포함)하여 반환합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

    private final WebClient.Builder webClientBuilder;
    
    @Value("${fastapi.url}")
    private String fastApiUrl;

    /**
     * 영양제 이미지 분석 실행
     * 1. AI 서버 호출 -> 2. 결과 가공 및 Mock 리포트 결합
     */
    public SupplementAnalysisResponse analyzeSupplement(MultipartFile file) {
        log.info("영양제 분석 요청 시작: filename={}", file.getOriginalFilename());

        // 1. FastAPI 호출 (AI 분석 요청)
        FastApiAnalysisResult aiResult = callFastApi(file);

        // 2. 결과 결합 및 Mock 데이터 생성
        return buildUnifiedResponse(aiResult);
    }

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
                    .block(); // 동기식 처리

            // AI 분석 결과 상세 로그 (OCR 인식 내용 확인용)
            if (result != null && result.getAnalysisResults() != null) {
                log.info("============== AI 분석 결과 상세 로그 ==============");
                for (int i = 0; i < result.getAnalysisResults().size(); i++) {
                    FastApiAnalysisResult.RawAnalysisResult raw = result.getAnalysisResults().get(i);
                    log.info("객체 #{} [Confidence: {}]", i + 1, raw.getConfidence());
                    log.info(" - 바코드: {}", raw.getBarcode() != null ? raw.getBarcode() : "미검출");
                    log.info(" - OCR 텍스트: {}", (raw.getOcrTexts() != null && !raw.getOcrTexts().isEmpty()) 
                            ? String.join(" | ", raw.getOcrTexts()) : "미검출");
                }
                log.info("================================================");
            }
            return result;

        } catch (IOException e) {
            log.error("FastAPI 호출 중 파일 읽기 실패", e);
            throw new RuntimeException("이미지 처리 중 오류가 발생했습니다.");
        } catch (Exception e) {
            log.error("FastAPI 통신 실패", e);
            throw new RuntimeException("AI 서버 분석 중 오류가 발생했습니다.");
        }
    }

    private SupplementAnalysisResponse buildUnifiedResponse(FastApiAnalysisResult aiResult) {
        // AI 결과를 DisplayData로 변환
        List<SupplementAnalysisResponse.ProductDisplayInfo> displayProducts = new ArrayList<>();
        if (aiResult != null && aiResult.getAnalysisResults() != null) {
            long tempId = 1000;
            for (FastApiAnalysisResult.RawAnalysisResult raw : aiResult.getAnalysisResults()) {
                // OCR 결과가 있으면 첫 번째 성분을 이름으로 임시 사용
                String productName = (raw.getOcrTexts() != null && !raw.getOcrTexts().isEmpty()) 
                        ? raw.getOcrTexts().get(0) : "인식된 영양제";
                
                displayProducts.add(SupplementAnalysisResponse.ProductDisplayInfo.builder()
                        .tempId(++tempId)
                        .name(productName)
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

        // 리포트용 Mock 데이터 생성
        SupplementAnalysisResponse.ReportData reportData = buildMockReportData(displayProducts);

        return SupplementAnalysisResponse.builder()
                .displayData(displayData)
                .reportData(reportData)
                .build();
    }

    private SupplementAnalysisResponse.ReportData buildMockReportData(List<SupplementAnalysisResponse.ProductDisplayInfo> products) {
        // Mock 제품 상세 정보
        List<SupplementAnalysisResponse.ReportProductInfo> reportProducts = products.stream()
                .map(p -> SupplementAnalysisResponse.ReportProductInfo.builder()
                        .productId(p.getTempId() - 950) // 임시 ID 매핑
                        .name(p.getName())             // ProductSection 표시용
                        .productName(p.getName() + " (Mock상세)")
                        .company("Mock 브랜드")
                        .imageUrl("https://picsum.photos/200/200")
                        .confidence(p.getConfidence()) // ProductSection 신뢰도 표시용
                        .ingredients(Arrays.asList(
                                SupplementAnalysisResponse.ProductIngredientInfo.builder()
                                        .name("비타민 D3")
                                        .amount("1000")
                                        .unit("IU")
                                        .dailyPercent(250)
                                        .build(),
                                SupplementAnalysisResponse.ProductIngredientInfo.builder()
                                        .name("아연")
                                        .amount("10")
                                        .unit("mg")
                                        .dailyPercent(85)
                                        .build()
                        ))
                        .build())
                .collect(Collectors.toList());

        // Mock 과복용 분석 정보
        SupplementAnalysisResponse.OverdoseAnalysis overdoseAnalysis = SupplementAnalysisResponse.OverdoseAnalysis.builder()
                .comparison(Arrays.asList(
                        SupplementAnalysisResponse.ComparisonResult.builder()
                                .name("비타민 D3")
                                .myAmount("800IU")
                                .newAmount("1000IU")
                                .totalAmount("1800IU")
                                .status("warning")
                                .build(),
                        SupplementAnalysisResponse.ComparisonResult.builder()
                                .name("아연")
                                .myAmount("0mg")
                                .newAmount("10mg")
                                .totalAmount("10mg")
                                .status("good")
                                .build()
                ))
                .recommendations(SupplementAnalysisResponse.Recommendations.builder()
                        .interactions(Arrays.asList(
                            SupplementAnalysisResponse.InteractionInfo.builder()
                                    .type("tip")
                                    .text("비타민 D는 지용성이므로 식사 후에 드시는 것이 흡수가 잘 됩니다.")
                                    .build()
                        ))
                        .dosageInfo(Arrays.asList(
                                SupplementAnalysisResponse.DosageInfo.builder()
                                        .name("비타민 D3")
                                        .min("400IU")
                                        .recommended("800IU")
                                        .max("4000IU")
                                        .current("1800IU")
                                        .status("warning")
                                        .build()
                        ))
                        .productNotes(Arrays.asList("이 제품은 전반적으로 안전하지만, 비타민 D 함량이 높습니다."))
                        .build())
                .build();

        return SupplementAnalysisResponse.ReportData.builder()
                .products(reportProducts)
                .overdoseAnalysis(overdoseAnalysis)
                .build();
    }
}
