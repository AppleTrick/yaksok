package com.ssafy.yaksok.product.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.product.dto.ProductDetailResponse;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.dto.ProductSearchResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductIngredientService productIngredientService;

    /**
     * 영양제 검색 (키워드 부분 일치)
     */
    @Transactional(readOnly = true)
    public List<ProductSearchResponse> searchProducts(String keyword) {
        log.debug("영양제 검색: keyword={}", keyword);

        List<Product> products = productRepository.findByPrdlstNmContaining(keyword);

        return products.stream()
                .map(p -> new ProductSearchResponse(p.getId(), p.getPrdlstNm()))
                .toList();
    }

    /**
     * 영양제 상세 정보 조회 (성분 포함)
     */
    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(Long productId) {
        log.debug("영양제 상세 조회: productId={}", productId);

        // 1. 제품 조회
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));

        // 2. 성분 조회
        List<ProductIngredientResponse> ingredients =
                productIngredientService.findIngredientsByProductIds(List.of(productId));

        // 3. 응답 생성
        return new ProductDetailResponse(
                product.getId(),
                product.getPrdlstNm(),
                product.getPrimaryFnclty(),
                product.getNtkMthd(),
                product.getIftknAtntMatrCn(),
                ingredients
        );
    }

    /**
     * ID로 제품 조회
     */
    public Product findById(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PRODUCT_NOT_FOUND));
    }
}