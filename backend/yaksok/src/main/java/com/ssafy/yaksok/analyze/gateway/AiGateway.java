package com.ssafy.yaksok.analyze.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.exception.AnalyzeException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.util.retry.Retry;

import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiGateway {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${fastapi.url}")
    private String fastApiUrl;

    public FastApiAnalysisResult callAiServer(MultipartFile file) {
        log.info("[AI_GATEWAY] FastAPI 서버 호출 시작: URL={}", fastApiUrl);
        try {
            byte[] fileBytes = file.getBytes();
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "image.jpg";
            }

            WebClient webClient = webClientBuilder.build();

            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(fileBytes))
                    .filename(originalFilename)
                    .contentType(MediaType.IMAGE_JPEG);

            String rawResponse = webClient.post()
                    .uri(fastApiUrl)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(30))
                    .retryWhen(Retry.backoff(2, Duration.ofSeconds(2))
                            .filter(throwable -> throwable instanceof java.util.concurrent.TimeoutException
                                    || throwable instanceof IOException))
                    .block();

            if (rawResponse == null) {
                throw new AnalyzeException(ErrorCode.ANALYZE_AI_SERVER_ERROR, "AI_GATEWAY", "응답이 비어있습니다.");
            }

            log.info("[AI_GATEWAY] AI 서버 응답 수신 완료");
            FastApiAnalysisResult result = objectMapper.readValue(rawResponse, FastApiAnalysisResult.class);

            if (result == null || !result.isSuccess()) {
                log.warn("[AI_GATEWAY] 분석 결과가 비어있거나 실패함");
                return new FastApiAnalysisResult(false, "분석 실패", "yolo", new ArrayList<>());
            }
            return result;

        } catch (AnalyzeException e) {
            throw e;
        } catch (Exception e) {
            log.error("[AI_GATEWAY] 서버 연동 중 오류 발생: {}", e.getMessage(), e);
            throw new AnalyzeException(ErrorCode.ANALYZE_AI_SERVER_ERROR, "AI_GATEWAY", e.getMessage());
        }
    }
}
