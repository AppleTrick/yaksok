package com.ssafy.yaksok.product.controller;

import com.ssafy.yaksok.facade.userProductNotification.UserProductNotificationService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.product.dto.*;
import com.ssafy.yaksok.product.service.ProductService;
import com.ssafy.yaksok.product.service.UserProductService;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final UserProductService userProductService;
    private final UserProductNotificationService userProductNotificationService;

    /**
     * 영양제 검색
     * GET /api/v1/products/search?keyword=비타민
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProductSearchResponse>>> searchProducts(
            @RequestParam String keyword) {
        log.info("영양제 검색 요청: keyword={}", keyword);
        List<ProductSearchResponse> results = productService.searchProducts(keyword);
        return ResponseUtil.ok(results);
    }

    /**
     * 영양제 상세 조회
     * GET /api/v1/products/{productId}
                */
        @GetMapping("/{productId}")
        public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductDetail(
                @PathVariable Long productId) {
            log.info("영양제 상세 조회: productId={}", productId);
            ProductDetailResponse response = productService.getProductDetail(productId);
        return ResponseUtil.ok(response);
    }

    /**
     * 내 영양제 목록 조회
     * GET /api/v1/products/user
     * (인증 필요)
     */
    @GetMapping("/user")
    public ResponseEntity<ApiResponse<List<UserProductResponse>>> getUserProducts(
            @AuthenticationPrincipal UserPrincipal principal) {
        log.info("사용자 영양제 목록 조회: userId={}", principal.getUserId());
        List<UserProductResponse> userProducts =
                userProductService.getUserProducts(principal.getUserId());
        return ResponseUtil.ok(userProducts);
    }

    /**
     * 영양제 등록
     * POST /api/v1/products/user
     * (인증 필요)
     */
    @PostMapping("/user")
    public ResponseEntity<ApiResponse<Void>> registerUserProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody RegisterUserProductRequest request) {
        log.info("영양제 등록 요청: userId={}, productId={}",
                principal.getUserId(), request.getProductId());

        userProductService.registerUserProduct(principal.getUserId(), request);

        return ResponseUtil.ok();
    }

    @PostMapping("/user/self")
    public ResponseEntity<ApiResponse<Void>> registerUserProductSelf(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody RegisterUserProductSelfRequest request) {
        log.info("영양제 등록 요청: userId={}, nickname={}",
                principal.getUserId(), request.getNickname());
        userProductNotificationService.registerUserProductSelf(principal.getUserId(), request);
        userProductNotificationService.registerNotificaion(principal.getUserId(), request);

        return ResponseUtil.ok();
    }

    /**
     * 영양제 삭제
     * DELETE /api/v1/products/user/{userProductId}
     * (인증 필요)
     */
    @DeleteMapping("/user/{userProductId}")
    public ResponseEntity<ApiResponse<Void>> deleteUserProduct(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userProductId) {
        log.info("영양제 삭제 요청: userId={}, userProductId={}",
                principal.getUserId(), userProductId);

        userProductService.deleteUserProduct(principal.getUserId(), userProductId);

        return ResponseUtil.ok();
    }
}