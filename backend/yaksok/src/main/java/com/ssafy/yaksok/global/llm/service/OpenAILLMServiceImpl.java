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
 * OpenAI LLM 서비스 구현체
 * - 401 에러 자동 보정 (따옴표 제거, 공백 제거)
 * - 개인 키 사용 시 공식 URL 권장 로직 추가
 */
@Slf4j
@Service
public class OpenAILLMServiceImpl implements LLMService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model:gpt-3.5-turbo}")
    private String model;

    // [수정] 기본 URL을 SSAFY 프록시에서 'OpenAI 공식 API'로 변경
    // 개인 키(sk-...)를 사용하는 경우 공식 API를 호출해야 401 에러가 발생하지 않습니다.
    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * [진단] 서버 시작 시 API Key 상태를 확인합니다.
     */
    @PostConstruct
    public void init() {
        String cleanKey = getCleanKey();

        log.info("============== [OpenAI 설정 확인] ==============");
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

            // [추가] URL과 키 타입 불일치 경고
            if (apiUrl.contains("ssafy.io") && cleanKey.startsWith("sk-")) {
                log.warn("⚠️ [주의] 개인 키(sk-...)를 SSAFY 프록시 URL에 사용 중입니다.");
                log.warn("   인증 오류(401)가 발생할 경우, application.yml의 openai.api.url을 지우거나 공식 URL로 변경하세요.");
            }
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
            throw new RuntimeException("OpenAI API Key 설정 오류");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // [핵심] 정제된 키 사용 (Bearer Auth 설정)
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
                JsonNode root = objectMapper.readTree(response.getBody());
                if (root.has("choices") && root.path("choices").size() > 0) {
                    return root.path("choices").get(0).path("message").path("content").asText();
                }
            }

            throw new RuntimeException("응답 파싱 실패: " + response.getBody());

        } catch (Exception e) {
            if (e.getMessage().contains("401")) {
                log.error("❌ [401 Unauthorized] 인증 실패.");
                log.error("👉 현재 URL: {}", apiUrl);

                if (apiUrl.contains("ssafy")) {
                    log.error("💡 해결책: SSAFY 프록시는 개인 키를 지원하지 않을 수 있습니다.");
                    log.error("   application.yml에서 openai.api.url을 'https://api.openai.com/v1/chat/completions'로 변경하세요.");
                } else {
                    log.error("💡 해결책: API Key가 만료되었거나 잘못되었습니다.");
                }
            }
            log.error("LLM 호출 중 오류: {}", e.getMessage());
            throw new RuntimeException("LLM 호출 실패", e);
        }
    }
}