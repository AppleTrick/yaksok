package com.ssafy.yaksok.product.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.global.llm.service.LLMService;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
import com.ssafy.yaksok.ingredient.service.IngredientNormalizationService;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.product.repository.ProductIngredientRepository;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * OCR 제품명을 DB 제품과 매칭하는 서비스 (리팩토링 버전)
 *
 * ✅ Case 1: DB에 제품이 있을 때
 *   → 1~2단계 매칭 성공 → 기존 성분 조회
 *
 * ✅ Case 2: DB에 제품이 없을 때
 *   → 3단계 LLM 호출 → 제품 + 성분 함께 생성
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductMatchingService {

    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;
    private final LLMService llmService;
    private final IngredientNormalizationService normalizationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ========================================
    // 메인 API
    // ========================================

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

        // 3단계: LLM으로 제품 + 성분 함께 생성
        log.info("[3단계] DB에 없는 제품, LLM으로 생성 시도");
        return createProductWithIngredientsUsingLLM(ocrProductName);
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

        List<Product> allProducts = productRepository.findAll();
        String normalizedOCR = normalizeProductName(ocrProductName);

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

        final double THRESHOLD = 0.8;
        if (bestScore >= THRESHOLD) {
            log.info("[2단계] 유사도 매칭: {} ≈ {} (score: {})",
                    ocrProductName, bestMatch.getPrdlstNm(), bestScore);
            return Optional.of(bestMatch);
        }

        log.debug("[2단계] 유사도 매칭 실패 (최고 점수: {})", bestScore);
        return Optional.empty();
    }

    /**
     * 제품명 정규화
     */
    private String normalizeProductName(String name) {
        return name
                .replaceAll("\\s+", "")
                .replaceAll("[^가-힣a-zA-Z0-9]", "")
                .toLowerCase();
    }

    /**
     * Levenshtein Distance 기반 유사도 계산
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

        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;

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
    // 3단계: LLM으로 제품 + 성분 생성
    // ========================================

    /**
     * LLM으로 제품 존재 여부 검증
     */
    private boolean verifyProductExists(String ocrProductName) {
        try {
            log.info("[3-1단계] 제품 존재 여부 검증: {}", ocrProductName);

            String verifyPrompt = buildProductVerificationPrompt(ocrProductName);
            String response = llmService.query(verifyPrompt, 0.1);
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
     * 제품 존재 여부 검증 프롬프트
     */
    private String buildProductVerificationPrompt(String ocrProductName) {
        return String.format("""
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
    }

    /**
     * LLM으로 신규 제품 + 성분 함께 생성
     */
    private Product createProductWithIngredientsUsingLLM(String ocrProductName) {
        // 1. 제품 존재 여부 검증
        if (!verifyProductExists(ocrProductName)) {
            log.warn("[3단계] 제품이 존재하지 않거나 확인할 수 없음: {}", ocrProductName);
            throw new ProductNotFoundException(
                    "제품을 찾을 수 없습니다. 제품명을 확인하거나 수동으로 등록해주세요: " + ocrProductName
            );
        }

        try {
            log.info("[3-2단계] 제품 + 성분 정보 수집: {}", ocrProductName);

            // 2. LLM으로 제품 + 성분 정보 추출
            String prompt = buildProductWithIngredientsPrompt(ocrProductName);
            String response = llmService.query(prompt, 0.1);

            // 3. 응답 파싱
            ProductWithIngredientsDto dto = parseProductWithIngredientsResponse(response);

            // 4. Product 저장
            Product product = saveProduct(dto);

            // 5. Ingredient + ProductIngredient 저장
            saveProductIngredients(product, dto.getIngredients());

            log.info("[3단계] 신규 제품 + 성분 생성 완료: {} (성분 {}개)",
                    product.getPrdlstNm(), dto.getIngredients().size());

            return product;

        } catch (Exception e) {
            log.error("[3단계] 신규 제품 생성 실패: {}", e.getMessage());
            throw new RuntimeException("제품 정보 수집 실패: " + ocrProductName, e);
        }
    }

    /**
     * 제품 + 성분 추출 프롬프트
     */
    private String buildProductWithIngredientsPrompt(String ocrProductName) {
        return String.format("""
            당신은 영양제 전문가입니다.
            
            제품명: "%s"
            
            이 제품에 대한 정보를 웹 검색을 통해 확인하고 다음 JSON 형식으로 제공해주세요:
            {
              "productName": "정확한 제품명",
              "primaryFunction": "주요 기능 (예: 면역력 증진)",
              "intakeMethod": "섭취 방법 (예: 1일 1회, 1회 1정)",
              "precautions": "주의사항 (예: 임산부 섭취 금지)",
              "ingredients": [
                {
                  "name": "성분명",
                  "amount": "숫자만",
                  "unit": "단위 (mg, μg, g, IU 등)"
                }
              ]
            }
            
            규칙:
            1. 반드시 웹 검색으로 확인한 정보만 제공
            2. 추측하거나 임의로 생성하지 말 것
            3. 모든 필드는 한국어로 작성
            4. 정보를 찾을 수 없는 필드는 "정보 없음"으로 표시
            5. ingredients는 주요 성분 위주로 작성 (5~10개 정도)
            6. amount는 순수 숫자만 (예: "1000", "25")
            7. unit은 표준 단위 사용 (mg, μg, g, IU, mcg)
            """, ocrProductName);
    }

    /**
     * LLM 응답 파싱 (제품 + 성분)
     */
    private ProductWithIngredientsDto parseProductWithIngredientsResponse(String response) {
        try {
            String json = response.replaceAll("```json|```", "").trim();
            JsonNode root = objectMapper.readTree(json);

            // 제품 정보
            String productName = root.path("productName").asText();
            String primaryFunction = root.path("primaryFunction").asText();
            String intakeMethod = root.path("intakeMethod").asText();
            String precautions = root.path("precautions").asText();

            // 성분 정보
            List<IngredientDto> ingredients = new ArrayList<>();
            JsonNode ingredientsNode = root.path("ingredients");

            if (ingredientsNode.isArray()) {
                for (JsonNode node : ingredientsNode) {
                    String name = node.path("name").asText();
                    String amountStr = node.path("amount").asText();
                    String unit = node.path("unit").asText();

                    // 유효성 검사
                    if (name.isEmpty() || amountStr.isEmpty() || unit.isEmpty()) {
                        log.warn("성분 정보 불완전, 스킵: {}", node);
                        continue;
                    }

                    try {
                        BigDecimal amount = new BigDecimal(amountStr.replaceAll(",", ""));
                        ingredients.add(new IngredientDto(name, amount, unit));
                    } catch (NumberFormatException e) {
                        log.warn("성분 수량 파싱 실패, 스킵: {} = {}", name, amountStr);
                    }
                }
            }

            return new ProductWithIngredientsDto(
                    productName,
                    primaryFunction,
                    intakeMethod,
                    precautions,
                    ingredients
            );

        } catch (Exception e) {
            throw new RuntimeException("LLM 응답 파싱 실패", e);
        }
    }

    /**
     * Product 엔티티 저장
     */
    private Product saveProduct(ProductWithIngredientsDto dto) {
        Product product = Product.builder()
                .prdlstNm(dto.getProductName())
                .primaryFnclty(dto.getPrimaryFunction())
                .ntkMthd(dto.getIntakeMethod())
                .iftknAtntMatrCn(dto.getPrecautions())
                .build();

        Product saved = productRepository.save(product);
        log.info("Product 저장 완료: id={}, name={}", saved.getId(), saved.getPrdlstNm());

        return saved;
    }

    /**
     * 성분 + 중간 테이블 저장 (단위 정규화 포함)
     */
    private void saveProductIngredients(Product product, List<IngredientDto> ingredientDtos) {
        log.info("성분 저장 시작: {} ({}개)", product.getPrdlstNm(), ingredientDtos.size());

        List<ProductIngredient> productIngredients = new ArrayList<>();

        for (IngredientDto dto : ingredientDtos) {
            try {
                // 1. Ingredient 찾거나 생성
                Ingredient ingredient = findOrCreateIngredient(dto.getName());

                // 2. ProductIngredient 생성
                ProductIngredient pi = ProductIngredient.builder()
                        .product(product)
                        .ingredient(ingredient)
                        .ingredientAmount(dto.getAmount())
                        .amountUnit(dto.getUnit())
                        .build();

                productIngredients.add(pi);

            } catch (Exception e) {
                log.error("성분 저장 실패: {} - {}", dto.getName(), e.getMessage());
            }
        }

        // 3. 일괄 저장
        List<ProductIngredient> saved = productIngredientRepository.saveAll(productIngredients);
        log.info("ProductIngredient 저장 완료: {}개", saved.size());

        // 4. 단위 정규화 (IU → mg/μg, 비표준 → 표준)
        try {
            normalizationService.normalizeIngredients(saved);
            log.info("단위 정규화 완료");
        } catch (Exception e) {
            log.error("단위 정규화 실패 (계속 진행): {}", e.getMessage());
        }
    }

    /**
     * Ingredient 찾거나 신규 생성
     */
    private Ingredient findOrCreateIngredient(String ingredientName) {
        return ingredientRepository.findByIngredientName(ingredientName)
                .orElseGet(() -> {
                    log.info("신규 Ingredient 생성: {}", ingredientName);
                    Ingredient newIngredient = Ingredient.builder()
                            .ingredientName(ingredientName)
                            .displayUnit("정보 없음")
                            .build();
                    return ingredientRepository.save(newIngredient);
                });
    }

    // ========================================
    // 내부 DTO
    // ========================================

    /**
     * 제품 + 성분 통합 DTO
     */
    private static class ProductWithIngredientsDto {
        private final String productName;
        private final String primaryFunction;
        private final String intakeMethod;
        private final String precautions;
        private final List<IngredientDto> ingredients;

        public ProductWithIngredientsDto(
                String productName,
                String primaryFunction,
                String intakeMethod,
                String precautions,
                List<IngredientDto> ingredients
        ) {
            this.productName = productName;
            this.primaryFunction = primaryFunction;
            this.intakeMethod = intakeMethod;
            this.precautions = precautions;
            this.ingredients = ingredients;
        }

        public String getProductName() { return productName; }
        public String getPrimaryFunction() { return primaryFunction; }
        public String getIntakeMethod() { return intakeMethod; }
        public String getPrecautions() { return precautions; }
        public List<IngredientDto> getIngredients() { return ingredients; }
    }

    /**
     * 성분 DTO
     */
    private static class IngredientDto {
        private final String name;
        private final BigDecimal amount;
        private final String unit;

        public IngredientDto(String name, BigDecimal amount, String unit) {
            this.name = name;
            this.amount = amount;
            this.unit = unit;
        }

        public String getName() { return name; }
        public BigDecimal getAmount() { return amount; }
        public String getUnit() { return unit; }
    }

    // ========================================
    // 예외 클래스
    // ========================================

    /**
     * 제품을 찾을 수 없을 때 발생하는 예외
     */
    public static class ProductNotFoundException extends RuntimeException {
        public ProductNotFoundException(String message) {
            super(message);
        }
    }
}