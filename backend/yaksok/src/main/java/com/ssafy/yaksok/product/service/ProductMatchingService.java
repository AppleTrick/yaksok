package com.ssafy.yaksok.product.service;

// LLM 생성 기능 비활성화로 인해 주석 처리
// import com.fasterxml.jackson.databind.JsonNode;
// import com.fasterxml.jackson.databind.ObjectMapper;
// import com.ssafy.yaksok.global.llm.service.LLMService;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * OCR 제품명을 DB 제품과 매칭하는 서비스 (2단계)
 * - 3단계 LLM 신규 생성 기능은 비활성화됨
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductMatchingService {

    private final ProductRepository productRepository;
    // LLM 생성 기능 비활성화됨
    // private final LLMService llmService;
    // private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * OCR 제품명으로 제품 찾기 (3단계 전략)
     *
     * @param ocrProductName OCR로 인식된 제품명
     * @return 매칭된 Product (없으면 null)
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

        // 3단계: LLM 신규 생성 비활성화 (OCR 오타로 인한 DB 오염 방지)
        // LLM 분석은 최종 단계(LlmAnalyzer)에서 Type B 데이터로 처리
        log.info("[매칭 실패] DB에서 제품을 찾을 수 없음: {}", ocrProductName);
        return null;
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
     * 유사도 기반 매칭 (최적화됨: findAll() 대신 Containing 쿼리 사용)
     */
    private Optional<Product> trySimilarityMatch(String ocrProductName) {
        log.info("[2단계] 유사도 검사 시작: {}", ocrProductName);
        long startTime = System.currentTimeMillis();

        // 정규화된 OCR 이름에서 검색 키워드 추출
        String normalizedOCR = normalizeProductName(ocrProductName);

        // 키워드 추출: 2글자 이상의 한글 단어 추출
        String searchKeyword = extractSearchKeyword(ocrProductName);

        if (searchKeyword == null || searchKeyword.length() < 2) {
            log.debug("[2단계] 유효한 검색 키워드 없음, 건너뜀");
            return Optional.empty();
        }

        // Candidate Filtering: Containing 쿼리로 후보군 압축 (findAll 대신!)
        List<Product> candidates = productRepository.findByPrdlstNmContaining(searchKeyword);
        log.info("[2단계] 후보군 압축: '{}' 키워드로 {}개 후보 발견", searchKeyword, candidates.size());

        // 후보가 없으면 즉시 종료
        if (candidates.isEmpty()) {
            log.debug("[2단계] 후보군 없음, 매칭 실패");
            return Optional.empty();
        }

        // 후보가 너무 많으면 100개로 제한
        if (candidates.size() > 100) {
            log.warn("[2단계] 후보군 100개 초과 ({}개), 상위 100개만 분석", candidates.size());
            candidates = candidates.subList(0, 100);
        }

        // Limited Similarity Check: 후보군 내에서만 유사도 계산
        Product bestMatch = null;
        double bestScore = 0.0;

        for (Product product : candidates) {
            String normalizedDB = normalizeProductName(product.getPrdlstNm());
            double score = calculateSimilarity(normalizedOCR, normalizedDB);

            if (score > bestScore) {
                bestScore = score;
                bestMatch = product;
            }
        }

        long elapsed = System.currentTimeMillis() - startTime;

        // 임계값 이상이면 매칭 성공
        final double THRESHOLD = 0.7; // 70% 이상 유사 (임계값 낮춤)
        if (bestScore >= THRESHOLD && bestMatch != null) {
            log.info("[2단계] ✅ 유사도 매칭 성공: '{}' → '{}' (score: {:.2f}, {}ms)",
                    ocrProductName, bestMatch.getPrdlstNm(), bestScore, elapsed);
            return Optional.of(bestMatch);
        }

        log.info("[2단계] ❌ 유사도 매칭 실패 - 최고 점수: {:.2f} (임계값: 0.7), 소요: {}ms", bestScore, elapsed);
        return Optional.empty();
    }

    /**
     * OCR 텍스트에서 검색용 키워드 추출 (2글자 이상 한글)
     */
    private String extractSearchKeyword(String ocrText) {
        // 한글만 추출
        String koreanOnly = ocrText.replaceAll("[^가-힣]", " ").trim();
        String[] words = koreanOnly.split("\\s+");

        // 가장 긴 한글 단어 반환 (2글자 이상)
        String longest = null;
        for (String word : words) {
            if (word.length() >= 2) {
                if (longest == null || word.length() > longest.length()) {
                    longest = word;
                }
            }
        }

        log.debug("[2단계] 검색 키워드 추출: '{}' → '{}'", ocrText, longest);
        return longest;
    }

    /**
     * 제품명 정규화 (유사도 비교용)
     */
    private String normalizeProductName(String name) {
        return name
                .replaceAll("\\s+", "") // 공백 제거
                .replaceAll("[^가-힣a-zA-Z0-9]", "") // 특수문자 제거
                .toLowerCase(); // 소문자 변환
    }

    /**
     * 문자열 유사도 계산 (Levenshtein Distance)
     */
    private double calculateSimilarity(String s1, String s2) {
        int distance = levenshteinDistance(s1, s2);
        int maxLength = Math.max(s1.length(), s2.length());

        if (maxLength == 0)
            return 1.0;

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
                        dp[i - 1][j - 1] + cost);
            }
        }

        return dp[s1.length()][s2.length()];
    }

    // ========================================
    // 3단계: LLM으로 제품 검증 및 신규 생성 (비활성화됨)
    // OCR 오타로 인한 DB 오염 방지를 위해 LLM 신규 생성 기능을 비활성화하였습니다.
    // LLM 분석은 최종 단계(LlmAnalyzer)에서 Type B 데이터로 처리됩니다.
    // ========================================

    /*
     * private boolean verifyProductExists(String ocrProductName) {
     * try {
     * log.info("[3-1단계] 제품 존재 여부 검증: {}", ocrProductName);
     * 
     * String verifyPrompt = String.format("""
     * 제품명: "%s"
     * 
     * 이 제품이 실제로 판매되는 영양제/건강기능식품인지 웹 검색으로 확인해주세요.
     * 
     * 다음 JSON 형식으로만 응답해주세요:
     * {
     * "exists": true 또는 false,
     * "confidence": "high" 또는 "medium" 또는 "low",
     * "source": "확인한 출처 URL (존재하는 경우)"
     * }
     * 
     * 규칙:
     * 1. 반드시 웹 검색으로 확인
     * 2. 확실하지 않으면 exists: false 반환
     * 3. confidence가 high인 경우만 exists: true
     * """, ocrProductName);
     * 
     * String response = llmService.query(verifyPrompt);
     * String json = response.replaceAll("```json|```", "").trim();
     * JsonNode node = objectMapper.readTree(json);
     * 
     * boolean exists = node.path("exists").asBoolean();
     * String confidence = node.path("confidence").asText();
     * 
     * log.info("[3-1단계] 검증 결과 - exists: {}, confidence: {}", exists, confidence);
     * 
     * return exists && "high".equals(confidence);
     * 
     * } catch (Exception e) {
     * log.error("[3-1단계] 제품 검증 실패: {}", e.getMessage());
     * return false;
     * }
     * }
     * 
     * private Product createProductWithLLM(String ocrProductName) {
     * if (!verifyProductExists(ocrProductName)) {
     * log.warn("[3단계] 제품이 존재하지 않거나 확인할 수 없음: {}", ocrProductName);
     * throw new ProductNotFoundException(
     * "제품을 찾을 수 없습니다. 제품명을 확인하거나 수동으로 등록해주세요: " + ocrProductName);
     * }
     * 
     * try {
     * log.info("[3-2단계] 제품 상세 정보 수집: {}", ocrProductName);
     * String prompt = buildProductCreationPrompt(ocrProductName);
     * String response = llmService.query(prompt);
     * Product newProduct = parseProductResponse(response);
     * Product saved = productRepository.save(newProduct);
     * log.info("[3단계] 신규 제품 생성 완료: {}", saved.getPrdlstNm());
     * return saved;
     * 
     * } catch (Exception e) {
     * log.error("[3단계] 신규 제품 생성 실패: {}", e.getMessage());
     * throw new RuntimeException("제품 정보 수집 실패: " + ocrProductName, e);
     * }
     * }
     * 
     * private String buildProductCreationPrompt(String ocrProductName) {
     * return String.format("""
     * 당신은 영양제 전문가입니다.
     * 
     * 제품명: "%s"
     * 
     * 이 제품에 대한 정보를 웹 검색을 통해 확인하고 다음 JSON 형식으로 제공해주세요:
     * {
     * "productName": "정확한 제품명",
     * "primaryFunction": "주요 기능 (예: 면역력 증진)",
     * "intakeMethod": "섭취 방법 (예: 1일 1회, 1회 1정)",
     * "precautions": "주의사항 (예: 임산부 섭취 금지)"
     * }
     * 
     * 규칙:
     * 1. 반드시 웹 검색으로 확인한 정보만 제공
     * 2. 추측하거나 임의로 생성하지 말 것
     * 3. 모든 필드는 한국어로 작성
     * 4. 정보를 찾을 수 없는 필드는 "정보 없음"으로 표시
     * """, ocrProductName);
     * }
     * 
     * private Product parseProductResponse(String response) {
     * try {
     * String json = response.replaceAll("```json|```", "").trim();
     * JsonNode node = objectMapper.readTree(json);
     * 
     * return Product.builder()
     * .prdlstNm(node.path("productName").asText())
     * .primaryFnclty(node.path("primaryFunction").asText())
     * .ntkMthd(node.path("intakeMethod").asText())
     * .iftknAtntMatrCn(node.path("precautions").asText())
     * .build();
     * 
     * } catch (Exception e) {
     * throw new RuntimeException("LLM 응답 파싱 실패", e);
     * }
     * }
     */

    /**
     * 제품을 찾을 수 없을 때 발생하는 예외
     */
    public static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(String message) {
            super(message);
        }
    }
}