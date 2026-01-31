package com.ssafy.yaksok.global.llm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * OpenAI 기반 LLM 서비스 구현
 */
@Slf4j
@Service
public class OpenAILLMServiceImpl implements LLMService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.model:gpt-5-nano}")
    private String model;

    @Value("${openai.api.url:https://gms.ssafy.io/gmsapi/api.openai.com/v1/chat/completions}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String query(String prompt) {
        log.info("OpenAI LLM 호출 (모델: {})", model);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> body = Map.of(
                    "model", model,
                    "messages", List.of(Map.of("role", "user", "content", prompt)));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    apiUrl,
                    entity,
                    String.class);

            JsonNode root = objectMapper.readTree(response.getBody());
            String content = root.path("choices").get(0).path("message").path("content").asText();

            log.info("OpenAI 응답 수신 ({}자)", content.length());
            return content;

        } catch (Exception e) {
            log.error("OpenAI API 호출 실패: {}", e.getMessage());
            throw new RuntimeException("LLM 호출 실패: " + e.getMessage(), e);
        }
    }
}