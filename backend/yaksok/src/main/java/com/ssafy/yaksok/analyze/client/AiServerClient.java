package com.ssafy.yaksok.analyze.client;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;

/**
 * AI 서버 호출만 맡는다. 서킷 브레이커가 DB·LLM 처리까지 감싸던 때는
 * LLM이 느려도 "AI 서버 장애"로 세었다.
 */
@Slf4j
@Component
public class AiServerClient {

    private final WebClient webClient;
    private final String url;

    public AiServerClient(WebClient.Builder builder, @Value("${fastapi.url}") String url) {
        this.webClient = builder.codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024)).build();
        this.url = url;
    }

    @CircuitBreaker(name = "fastApiServer", fallbackMethod = "unavailable")
    public FastApiAnalysisResult analyze(byte[] image) {
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("file", new ByteArrayResource(image)).filename("photo.jpg").contentType(MediaType.IMAGE_JPEG);
        return webClient.post().uri(url)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(body.build()))
                .retrieve()
                .bodyToMono(FastApiAnalysisResult.class)
                .block(Duration.ofSeconds(30));
    }

    FastApiAnalysisResult unavailable(byte[] image, Exception e) {
        if (e instanceof WebClientResponseException w) {
            if (w.getStatusCode().value() == 503) throw new BusinessException(ErrorCode.ANALYZE_BUSY);
            if (w.getStatusCode().is4xxClientError()) throw new BusinessException(ErrorCode.ANALYZE_INVALID_IMAGE);
        }
        if (!(e instanceof CallNotPermittedException)) {
            log.error("AI 서버 호출 실패", e);
        }
        // 빈 결과를 성공처럼 돌려주면 사용자는 "영양제가 없다"로 오해한다
        throw new BusinessException(ErrorCode.ANALYZE_UNAVAILABLE);
    }
}
