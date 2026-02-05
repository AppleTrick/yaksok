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

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

    private final WebClient.Builder webClientBuilder;
    private final OcrAnalysisService ocrAnalysisService; // 업무 담당자 주입

    @Value("${fastapi.url}")
    private String fastApiUrl;

    public SupplementAnalysisResponse analyzeSupplement(MultipartFile file, Long userId) {
        log.info("이미지 분석 시작: User {}", userId);

        // 1. FastAPI 호출 (외부 통신)
        FastApiAnalysisResult aiResult = callFastApi(file);

        // 2. 비즈니스 로직 위임 (업무 처리)
        return ocrAnalysisService.processAnalysisResult(userId, aiResult);
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