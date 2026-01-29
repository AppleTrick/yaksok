package com.ssafy.yaksok.product.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.global.llm.service.LLMService;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * OCR 제품명을 DB 제품과 매칭하는 서비스 (3단계)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductMatchingService {

    private final ProductRepository productRepository;
    private final LLMService llmService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * OCR 제품명으로 제품 찾기 (3단계 전략)
     *
     * @param ocrProductName OCR로 인식된 제품명
     * @return 매칭된 Product
     */
    @Transactional
    public Product findProduct(String ocrProductName) {
        log.info("제품 매칭 시작: {}", ocrProductName);

        // 1단계: 정확 매칭
        Optional<Product> exactMatch = tryExactMatch(ocrProductName);
        if (exactMatch.isPresent()) {
            log.info("[1단계] 정확 매칭 성공: {}", exactMatch.get().getPrdlstNm());
            return exactMatch.get();
        }

        // 2단계: 유사도 검사
        Optional<Product> similarMatch = trySimilarityMatch(ocrProductName);
        if (similarMatch.isPresent()) {
            log.info("[2단계] 유사도 매칭 성공: {}", similarMatch.get().getPrdlstNm());
            return similarMatch.get();
        }

        // 3단계: LLM으로 제품 검증 및 신규 생성
        log.info("DB에 없는 제품, LLM으로 검증 및 신규 생성 시도");
        return createProductWithLLM(ocrProductName);
    }

    // ========================================
    // 1단계: 정확 매칭
    // ========================================

    /**
     * DB에서 정확 매칭 시도
     */
    private Optional<Product> tryExactMatch(String ocrProductName) {
        log.debug("[1단계] 정확 매칭 시도: {}", ocrProductName);
        return productRepository.findByPrdlstNm(ocrProductName);
    }

    // ========================================
    // 2단계: 유사도 검사
    // ========================================

    /**
     * 유사도 기반 매칭
     */
    private Optional<Product> trySimilarityMatch(String ocrProductName) {
        log.debug("[2단계] 유사도 검사 시작: {}", ocrProductName);

        // DB 모든 제품 가져오기
        List<Product> allProducts = productRepository.findAll();

        // 정규화된 OCR 이름
        String normalizedOCR = normalizeProductName(ocrProductName);

        // 가장 유사한 제품 찾기
        Product bestMatch = null;
        double bestScore = 0.0;

        for (Product product : allProducts) {
            String normalizedDB = normalizeProductName(product.getPrdlstNm());
            double score = calculateSimilarity(normalizedOCR, normalizedDB);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = product;
            }
        }

        // 임계값 이상이면 매칭 성공
        final double THRESHOLD = 0.8;  // 80% 이상 유사
        if (bestScore >= THRESHOLD) {
            log.info("[2단계] 유사도 매칭: {} ≈ {} (score: {})",
                    ocrProductName, bestMatch.getPrdlstNm(), bestScore);
            return Optional.of(bestMatch);
        }

        log.debug("[2단계] 유사도 매칭 실패 (최고 점수: {})", bestScore);
        return Optional.empty();
    }

    /**
     * 제품명 정규화 (유사도 비교용)
     */
    private String normalizeProductName(String name) {
        return name
                .replaceAll("\\s+", "")        // 공백 제거
                .replaceAll("[^가-힣a-zA-Z0-9]", "")  // 특수문자 제거
                .toLowerCase();                 // 소문자 변환
    }

    /**
     * 문자열 유사도 계산 (Levenshtein Distance)
     */
    private double calculateSimilarity(String s1, String s2) {
        int distance = levenshteinDistance(s1, s2);
        int maxLength = Math.max(s1.length(), s2.length());

        if (maxLength == 0) return 1.0;

        return 1.0 - ((double) distance / maxLength);
    }

    /**
     * Levenshtein Distance 계산
     */
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }

        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;

                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }

    // ========================================
    // 3단계: LLM으로 제품 검증 및 신규 생성
    // ========================================

    /**
     * LLM으로 제품 존재 여부 먼저 확인
     */
    private boolean verifyProductExists(String ocrProductName) {
        try {
            log.info("[3-1단계] 제품 존재 여부 검증: {}", ocrProductName);

            String verifyPrompt = String.format("""
                제품명: "%s"
                
                이 제품이 실제로 판매되는 영양제/건강기능식품인지 웹 검색으로 확인해주세요.
                
                다음 JSON 형식으로만 응답해주세요:
                {
                  "exists": true 또는 false,
                  "confidence": "high" 또는 "medium" 또는 "low",
                  "source": "확인한 출처 URL (존재하는 경우)"
                }
                
                규칙:
                1. 반드시 웹 검색으로 확인
                2. 확실하지 않으면 exists: false 반환
                3. confidence가 high인 경우만 exists: true
                """, ocrProductName);

            String response = llmService.query(verifyPrompt, 1);
            String json = response.replaceAll("```json|```", "").trim();
            JsonNode node = objectMapper.readTree(json);

            boolean exists = node.path("exists").asBoolean();
            String confidence = node.path("confidence").asText();

            log.info("[3-1단계] 검증 결과 - exists: {}, confidence: {}", exists, confidence);

            return exists && "high".equals(confidence);

        } catch (Exception e) {
            log.error("[3-1단계] 제품 검증 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * LLM으로 신규 제품 정보 수집 및 생성
     */
    private Product createProductWithLLM(String ocrProductName) {
        // 1. 먼저 제품 존재 여부 확인
        if (!verifyProductExists(ocrProductName)) {
            log.warn("[3단계] 제품이 존재하지 않거나 확인할 수 없음: {}", ocrProductName);
            throw new ProductNotFoundException(
                    "제품을 찾을 수 없습니다. 제품명을 확인하거나 수동으로 등록해주세요: " + ocrProductName
            );
        }

        // 2. 존재하는 제품인 경우 상세 정보 수집
        try {
            log.info("[3-2단계] 제품 상세 정보 수집: {}", ocrProductName);

            // 프롬프트 생성
            String prompt = buildProductCreationPrompt(ocrProductName);

            // LLM 호출
            String response = llmService.query(prompt, 1);

            // 응답 파싱
            Product newProduct = parseProductResponse(response);

            // DB 저장
            Product saved = productRepository.save(newProduct);

            log.info("[3단계] 신규 제품 생성 완료: {}", saved.getPrdlstNm());
            return saved;

        } catch (Exception e) {
            log.error("[3단계] 신규 제품 생성 실패: {}", e.getMessage());
            throw new RuntimeException("제품 정보 수집 실패: " + ocrProductName, e);
        }
    }

    /**
     * 신규 제품 생성 프롬프트
     */
    private String buildProductCreationPrompt(String ocrProductName) {
        return String.format("""
            당신은 영양제 전문가입니다.
            
            제품명: "%s"
            
            이 제품에 대한 정보를 웹 검색을 통해 확인하고 다음 JSON 형식으로 제공해주세요:
            {
              "productName": "정확한 제품명",
              "primaryFunction": "주요 기능 (예: 면역력 증진)",
              "intakeMethod": "섭취 방법 (예: 1일 1회, 1회 1정)",
              "precautions": "주의사항 (예: 임산부 섭취 금지)"
            }
            
            규칙:
            1. 반드시 웹 검색으로 확인한 정보만 제공
            2. 추측하거나 임의로 생성하지 말 것
            3. 모든 필드는 한국어로 작성
            4. 정보를 찾을 수 없는 필드는 "정보 없음"으로 표시
            """, ocrProductName);
    }

    /**
     * LLM 응답을 Product 엔티티로 변환
     */
    private Product parseProductResponse(String response) {
        try {
            String json = response.replaceAll("```json|```", "").trim();
            JsonNode node = objectMapper.readTree(json);

            return Product.builder()
                    .prdlstNm(node.path("productName").asText())
                    .primaryFnclty(node.path("primaryFunction").asText())
                    .ntkMthd(node.path("intakeMethod").asText())
                    .iftknAtntMatrCn(node.path("precautions").asText())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("LLM 응답 파싱 실패", e);
        }
    }

    /**
     * 제품을 찾을 수 없을 때 발생하는 예외
     */
    public static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(String message) {
            super(message);
        }
    }
}