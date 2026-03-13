package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
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
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

    private final WebClient.Builder webClientBuilder;
    private final OcrAnalysisService ocrAnalysisService; // 업무 담당자 주입

    @Value("${fastapi.url}")
    private String fastApiUrl;

    @CircuitBreaker(name = "fastApiServer", fallbackMethod = "fallbackAnalyzeSupplement")
    public SupplementAnalysisResponse analyzeSupplement(MultipartFile file, Long userId) {
        log.info("이미지 분석 시작: User {}", userId);
        long totalStart = System.currentTimeMillis();

        // 1. FastAPI 호출 (외부 통신)
        long fastApiStart = System.currentTimeMillis();
        FastApiAnalysisResult aiResult = callFastApi(file);
        log.info("[성능측정] FastAPI 호출 완료: {}ms", System.currentTimeMillis() - fastApiStart);

        // 2. 비즈니스 로직 위임 (업무 처리)
        long processStart = System.currentTimeMillis();
        SupplementAnalysisResponse response = ocrAnalysisService.processAnalysisResult(userId, aiResult);
        log.info("[성능측정] 비즈니스 로직 처리 완료: {}ms", System.currentTimeMillis() - processStart);

        log.info("[성능측정] 전체 분석 완료: {}ms", System.currentTimeMillis() - totalStart);
        return response;
    }

    /**
     * 서킷 브레이커 OPEN 시 fallback 처리
     * AI 서버 장애가 감지되면 빈 분석 결과를 반환해 메인 서버 스레드 고갈 방지
     */
    public SupplementAnalysisResponse fallbackAnalyzeSupplement(MultipartFile file, Long userId, Exception e) {
        log.warn("[서킷브레이커] AI 서버 장애 감지, fallback 응답 반환. userId={}, error={}", userId, e.getMessage());
        return SupplementAnalysisResponse.builder()
                .reportData(SupplementAnalysisResponse.ReportData.builder()
                        .products(Collections.emptyList())
                        .build())
                .build();
    }

    private FastApiAnalysisResult callFastApi(MultipartFile file) {
        try {
            WebClient webClient = webClientBuilder.build();
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()))
                    .filename(file.getOriginalFilename())
                    .contentType(MediaType.IMAGE_JPEG);

            FastApiAnalysisResult aiResult = webClient.post()
                    .uri(fastApiUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(FastApiAnalysisResult.class)
                    .block();

            log.info("FastAPI 분석 결과 수신: {}", aiResult);
            return aiResult;
        } catch (IOException e) {
            log.error("파일 에러", e);
            throw new RuntimeException("이미지 파일 처리 중 오류가 발생했습니다.");
        } catch (Exception e) {
            log.error("AI 서버 에러", e);
            throw new RuntimeException("AI 분석 서버와의 통신에 실패했습니다.");
        }
    }
}