package com.ssafy.yaksok.global.llm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.annotation.PostConstruct;
import java.util.List;
import java.util.Map;

/**
 * Groq LLM 서비스 구현체 (OpenAI 호환 API)
 * - 기본 모델(groq/compound) 호출이 실패하면 폴백 모델(qwen/qwen3.6-27b)로 자동 전환
 * - 401 에러 자동 보정 (따옴표 제거, 공백 제거)
 */
@Slf4j
@Service
public class GroqLLMServiceImpl implements LLMService {

    @Value("${groq.api.key}")
    private String apiKey;

    @Value("${groq.model.primary:groq/compound}")
    private String primaryModel;

    @Value("${groq.model.fallback:qwen/qwen3.6-27b}")
    private String fallbackModel;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * [진단] 서버 시작 시 API Key 상태를 확인합니다.
     */
    @PostConstruct
    public void init() {
        String cleanKey = getCleanKey();

        log.info("============== [Groq 설정 확인] ==============");
        if (cleanKey == null || cleanKey.isEmpty()) {
            log.error("🚨 API Key가 없습니다! application.yml을 확인해주세요.");
        } else if (cleanKey.startsWith("${")) {
            log.error("🚨 환경변수가 로드되지 않았습니다. IntelliJ 설정을 확인해주세요.");
        } else {
            String masked = cleanKey.length() > 10
                    ? cleanKey.substring(0, 5) + "..." + cleanKey.substring(cleanKey.length() - 3)
                    : "InvalidKey";
            log.info("✅ API Key 로드됨: [ {} ]", masked);
            log.info("✅ Target URL: {}", apiUrl);
            log.info("✅ Primary Model: {} / Fallback Model: {}", primaryModel, fallbackModel);
        }
        log.info("================================================");
    }

    /**
     * API Key 정제 (따옴표, 공백 제거)
     */
    private String getCleanKey() {
        if (apiKey == null) return null;
        String clean = apiKey.trim();
        clean = clean.replaceAll("^\"|\"$", "").replaceAll("^'|'$", "");
        return clean;
    }

    @Override
    public String query(String prompt) {
        return query(prompt, 1);
    }

    @Override
    public String query(String prompt, double temperature) {
        String cleanKey = getCleanKey();

        if (cleanKey == null || cleanKey.isEmpty() || cleanKey.startsWith("${")) {
            log.error("❌ 유효하지 않은 API Key: {}", apiKey);
            throw new RuntimeException("Groq API Key 설정 오류");
        }

        try {
            return callModel(primaryModel, prompt, temperature, cleanKey);
        } catch (Exception e) {
            log.warn("⚠️ [Groq] 기본 모델({}) 호출 실패, 폴백 모델({})로 재시도: {}",
                    primaryModel, fallbackModel, e.getMessage());
            try {
                return callModel(fallbackModel, prompt, temperature, cleanKey);
            } catch (Exception fallbackError) {
                log.error("❌ [Groq] 폴백 모델({}) 호출도 실패: {}", fallbackModel, fallbackError.getMessage());
                throw new RuntimeException("LLM 호출 실패 (기본/폴백 모델 모두 실패)", fallbackError);
            }
        }
    }

    private String callModel(String model, String prompt, double temperature, String cleanKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(cleanKey);

        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", temperature
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(
                apiUrl,
                HttpMethod.POST,
                entity,
                String.class
        );

        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("choices") && root.path("choices").size() > 0) {
                    return root.path("choices").get(0).path("message").path("content").asText();
                }
            } catch (Exception e) {
                throw new RuntimeException("응답 파싱 실패: " + response.getBody(), e);
            }
        }

        throw new RuntimeException("모델 [" + model + "] 응답 실패: " + response.getBody());
    }
}
