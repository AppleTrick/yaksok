package com.ssafy.yaksok.global.common.llm;

import com.ssafy.yaksok.global.common.llm.parser.LLMResponseParser;
import com.ssafy.yaksok.global.common.llm.prompt.PromptTemplate;
import com.ssafy.yaksok.global.llm.service.LLMService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * LLM 서비스 Facade
 *
 * 프롬프트 템플릿과 응답 파싱을 통합하여 간편한 LLM 호출을 제공합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LLMServiceFacade {

    private final LLMService llmService;
    private final LLMResponseParser responseParser;

    /**
     * 프롬프트 템플릿을 사용한 LLM 호출 (기본 temperature)
     *
     * @param template 프롬프트 템플릿
     * @param parameters 파라미터
     * @param responseType 응답 타입
     * @return 파싱된 응답 객체
     */
    public <T> T query(
            PromptTemplate template,
            Map<String, Object> parameters,
            Class<T> responseType
    ) {
        return query(template, parameters, responseType, 0.1);
    }

    /**
     * 프롬프트 템플릿을 사용한 LLM 호출 (커스텀 temperature)
     *
     * @param template 프롬프트 템플릿
     * @param parameters 파라미터
     * @param responseType 응답 타입
     * @param temperature 창의성 조절 (0.0 ~ 2.0)
     * @return 파싱된 응답 객체
     */
    public <T> T query(
            PromptTemplate template,
            Map<String, Object> parameters,
            Class<T> responseType,
            double temperature
    ) {
        log.info("LLM 호출 시작: template={}, type={}, temp={}",
                template.getName(), responseType.getSimpleName(), temperature);

        // 1. 프롬프트 생성
        String prompt = template.build(parameters);
        log.debug("생성된 프롬프트:\n{}", prompt);

        // 2. LLM 호출
        String rawResponse;
        try {
            rawResponse = llmService.query(prompt, temperature);
            log.debug("LLM 응답 수신: {} bytes", rawResponse.length());
        } catch (Exception e) {
            log.error("LLM 호출 실패: {}", e.getMessage());
            throw new com.ssafy.yaksok.global.common.llm.LLMServiceException(
                    "LLM 호출 실패: " + e.getMessage(),
                    template.getName(),
                    e
            );
        }

        // 3. 응답 파싱
        T result;
        try {
            result = responseParser.parse(rawResponse, responseType);
            log.info("LLM 호출 완료: template={}", template.getName());
        } catch (Exception e) {
            log.error("응답 파싱 실패: template={}", template.getName());
            throw new com.ssafy.yaksok.global.common.llm.LLMServiceException(
                    "응답 파싱 실패: " + e.getMessage(),
                    template.getName(),
                    e
            );
        }

        return result;
    }

    /**
     * 재시도 로직이 포함된 LLM 호출
     *
     * @param maxRetries 최대 재시도 횟수
     */
    public <T> T queryWithRetry(
            PromptTemplate template,
            Map<String, Object> parameters,
            Class<T> responseType,
            int maxRetries
    ) {
        return queryWithRetry(template, parameters, responseType, 0.1, maxRetries);
    }

    /**
     * 재시도 로직이 포함된 LLM 호출 (커스텀 temperature)
     */
    public <T> T queryWithRetry(
            PromptTemplate template,
            Map<String, Object> parameters,
            Class<T> responseType,
            double temperature,
            int maxRetries
    ) {
        int attempts = 0;
        Exception lastException = null;

        while (attempts < maxRetries) {
            try {
                return query(template, parameters, responseType, temperature);
            } catch (Exception e) {
                lastException = e;
                attempts++;
                log.warn("LLM 호출 실패 ({}/{}): {}",
                        attempts, maxRetries, e.getMessage());

                if (attempts < maxRetries) {
                    // 재시도 전 대기 (지수 백오프)
                    try {
                        long waitTime = (long) (Math.pow(2, attempts) * 1000);
                        log.info("{}ms 후 재시도...", waitTime);
                        Thread.sleep(waitTime);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        log.error("LLM 호출 최종 실패: template={}, attempts={}",
                template.getName(), attempts);
        throw new LLMServiceException(
                "LLM 호출 최종 실패 (" + attempts + "회 시도)",
                template.getName(),
                lastException
        );
    }

    /**
     * 안전한 LLM 호출 (예외 발생 시 null 반환)
     */
    public <T> T querySafe(
            PromptTemplate template,
            Map<String, Object> parameters,
            Class<T> responseType
    ) {
        try {
            return query(template, parameters, responseType);
        } catch (Exception e) {
            log.error("LLM 호출 실패 (null 반환): {}", e.getMessage());
            return null;
        }
    }
}