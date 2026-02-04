package com.ssafy.yaksok.product.service;

import com.ssafy.yaksok.global.common.dto.ProductExtractionResponse;
import com.ssafy.yaksok.global.common.llm.prompt.LLMServiceFacade;
import com.ssafy.yaksok.global.common.llm.prompt.ProductExtractionPrompt;
import com.ssafy.yaksok.global.common.unit.ConversionResult;
import com.ssafy.yaksok.global.common.unit.UnitConverter;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
import com.ssafy.yaksok.product.dto.ProductDetailResponse;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.product.repository.ProductIngredientRepository;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductMatchingService {

    private final ProductRepository productRepository;
    private final IngredientRepository ingredientRepository;
    private final ProductIngredientRepository productIngredientRepository;

    private final LLMServiceFacade llmServiceFacade;
    private final ProductExtractionPrompt extractionPrompt;
    private final UnitConverter unitConverter;

    @Transactional
    public ProductDetailResponse findProductDetails(String productName) {
        log.info("제품 상세 정보 검색 요청: {}", productName);

        Product product = findProductInDb(productName);

        if (product != null) {
            log.info("DB 매칭 성공: {}", product.getName());
            return toProductDetailResponse(product);
        }

        log.info("DB 매칭 실패. LLM을 통한 정보 추출 및 저장 시도: {}", productName);
        return fetchAndSaveProductFromLlm(productName);
    }

    private Product findProductInDb(String rawName) {
        if (rawName == null || rawName.isEmpty()) return null;
        Optional<Product> exact = productRepository.findByPrdlstNm(rawName);
        if (exact.isPresent()) return exact.get();
        List<Product> candidates = productRepository.findByPrdlstNmContaining(rawName);
        if (candidates.isEmpty()) return null;
        return candidates.stream()
                .min(Comparator.comparingInt(p -> Math.abs(p.getName().length() - rawName.length())))
                .orElse(null);
    }

    private ProductDetailResponse fetchAndSaveProductFromLlm(String productName) {
        log.info(">>> [LLM Service] '{}' 상세 정보 추출 시작", productName);

        Map<String, Object> params = Map.of("productName", productName);

        ProductExtractionResponse response = llmServiceFacade.querySafe(
                extractionPrompt,
                params,
                ProductExtractionResponse.class
        );

        if (response == null) {
            throw new RuntimeException("제품 정보를 찾을 수 없습니다: " + productName);
        }

        Product savedProduct = saveProductToDb(response);
        log.info("<<< [LLM Service] 제품 DB 저장 완료: ID={}, Name={}", savedProduct.getId(), savedProduct.getName());

        return toProductDetailResponse(savedProduct);
    }

    private Product saveProductToDb(ProductExtractionResponse response) {
        Product product = Product.builder()
                .prdlstNm(response.getProductName())
                .primaryFnclty(response.getPrimaryFunction())
                .ntkMthd(response.getIntakeMethod())
                .iftknAtntMatrCn(response.getPrecautions())
                .build();

        Product savedProduct = productRepository.save(product);

        for (var ingInfo : response.getIngredients()) {
            if (!ingInfo.isValid()) continue;

            BigDecimal amount = ingInfo.getAmountAsBigDecimal();
            String unit = ingInfo.getUnit();
            String ingName = ingInfo.getName().trim();

            ConversionResult conv = unitConverter.convert(ingName, amount, unit);

            if (conv.isSuccess()) {
                log.info("    -> [단위 변환] [{}] {} {} => {} {}",
                        ingName, amount, unit, conv.getAmount(), conv.getUnit());
                amount = conv.getAmount();
                unit = conv.getUnit();
            }

            BigDecimal finalAmount = amount;
            String finalUnit = unit;

            Ingredient ingredient = ingredientRepository.findByIngredientName(ingName)
                    .orElseGet(() -> ingredientRepository.save(Ingredient.builder()
                            .ingredientName(ingName)
                            .displayUnit(finalUnit)
                            .minIntakeValue(BigDecimal.ZERO)
                            .maxIntakeValue(BigDecimal.valueOf(9999))
                            .build()));

            ProductIngredient productIngredient = ProductIngredient.builder()
                    .product(savedProduct)
                    .ingredient(ingredient)
                    .ingredientAmount(finalAmount)
                    .amountUnit(finalUnit)
                    .build();

            productIngredientRepository.save(productIngredient);

            // [중요] 저장된 성분을 로그로 확인
            log.info("    [성분 저장] [{}] {} {}", ingName, finalAmount, finalUnit);

            // 영속성 컨텍스트 동기화 (응답 생성을 위해 리스트에 추가)
            savedProduct.getProductIngredients().add(productIngredient);
        }

        return savedProduct;
    }

    private ProductDetailResponse toProductDetailResponse(Product product) {
        // [수정] productIngredientRepository.findByProduct(product) 대신 엔티티의 Getter 사용
        // @Transactional 내부이므로 지연 로딩(Lazy Loading)이 정상 동작하여 성분 목록을 가져옵니다.
        List<ProductIngredient> piList = product.getProductIngredients();

        List<ProductIngredientResponse> ingredients = piList.stream()
                .map(pi -> ProductIngredientResponse.builder()
                        .productId(product.getId())
                        .ingredientId(pi.getIngredient().getId())
                        .name(pi.getIngredient().getIngredientName())
                        .amount(pi.getIngredientAmount())
                        .unit(pi.getAmountUnit())
                        .build())
                .collect(Collectors.toList());

        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getPrimaryFunction(),
                product.getIntakeMethod(),
                product.getPrecautions(),
                ingredients
        );
    }
}