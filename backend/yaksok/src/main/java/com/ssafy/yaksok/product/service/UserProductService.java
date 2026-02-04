package com.ssafy.yaksok.product.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.dto.RegisterUserProductRequest;
import com.ssafy.yaksok.product.dto.RegisterUserProductSelfRequest;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.repository.UserProductRepository;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


@Slf4j
@Service
@RequiredArgsConstructor
public class UserProductService {
    private final UserProductRepository userProductRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final ProductIngredientService productIngredientService;

    /**
     * 사용자 영양제 목록 조회
     */
    @Transactional(readOnly = true)
    public List<UserProductResponse> getUserProducts(Long userId) {
        log.debug("사용자 영양제 목록 조회: userId={}", userId);

        // 1. 사용자 영양제 기본 정보 조회
        List<UserProductResponse> userProducts =
                userProductRepository.findUserProducts(userId);

        if (userProducts.isEmpty()) {
            return List.of();
        }

        // 2. productId 목록 추출 (null 포함)
        List<Long> productIds = userProducts.stream()
                .map(UserProductResponse::getProductId)
                .toList();

        // 3. productId가 null이 아닌 것만 성분 조회 대상으로 사용
        List<Long> validProductIds = productIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        // 4. productId → 성분 맵 구성
        Map<Long, List<ProductIngredientResponse>> ingredientMap;

        if (!validProductIds.isEmpty()) {
            List<ProductIngredientResponse> ingredients =
                    productIngredientService.findIngredientsByProductIds(validProductIds);

            ingredientMap = ingredients.stream()
                    .collect(Collectors.groupingBy(
                            ProductIngredientResponse::getProductId
                    ));
        } else {
            ingredientMap = Map.of();
        }

        // 5. userProducts에 성분 주입 (null은 null로 유지)
        userProducts.forEach(up -> {
            if (up.getProductId() == null) {
                // 셀프 등록 영양제 → product 자체가 없음
                up.setIngredients(null);
            } else {
                // product는 있으나 성분이 없을 수도 있음
                up.setIngredients(
                        ingredientMap.getOrDefault(up.getProductId(), List.of())
                );
            }
        });

        log.info("사용자 영양제 조회 완료: userId={}, count={}", userId, userProducts.size());
        return userProducts;
    }

    /**
     * 영양제 등록 (본인 것만 등록 - 가족 기능 제외)
     */
    @Transactional
    public void registerUserProduct(Long userId, RegisterUserProductRequest request) {
        log.info("영양제 등록 시작: userId={}, productId={}", userId, request.getProductId());

        // 1. 사용자 검증
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        log.debug("사용자 검증 완료: {}", user.getName());

        // 2. 제품 검증
        Product product = productService.findById(request.getProductId());
        log.debug("제품 검증 완료: {}", product.getPrdlstNm());

        // 3. UserProduct 생성 (user와 targetMember를 동일하게 설정)
        UserProduct userProduct = UserProduct.create(
                user,
                product,
                request.getNickname(),
                request.getDailyDose(),
                request.getDoseAmount(),
                request.getDoseUnit()
        );

        // 4. 저장
        userProductRepository.save(userProduct);

        log.info("영양제 등록 완료: userProductId={}", userProduct.getId());
    }

    /**
     * 영양제 삭제 (권한 체크)
     */
    @Transactional
    public void deleteUserProduct(Long userId, Long userProductId) {
        log.info("영양제 삭제 시도: userId={}, userProductId={}", userId, userProductId);

        // 1. UserProduct 조회
        UserProduct userProduct = userProductRepository.findById(userProductId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PRODUCT_NOT_FOUND));

        // 2. 권한 검증 (본인 것만 삭제 가능)
        if (!userProduct.getUser().getId().equals(userId)) {
            log.warn("권한 없는 삭제 시도: userId={}, ownerId={}",
                    userId, userProduct.getUser().getId());
            throw new BusinessException(ErrorCode.USER_PRODUCT_UNAUTHORIZED);
        }

        // 3. 삭제
        userProductRepository.delete(userProduct);

        log.info("영양제 삭제 완료: userProductId={}", userProductId);
    }

    public UserProduct findByUserIdAndNickname(long userId, String nickname){
        return userProductRepository.findByUserIdAndNickname(userId, nickname).orElseThrow(
                () -> new BusinessException(ErrorCode.USER_PRODUCT_NOT_FOUND)
        );
    }

    public void registerUserProductSelf(UserProduct userProduct){
        if(userProductRepository.existsByUserIdAndNickname(userProduct.getUser().getId(), userProduct.getNickname())){
            throw new BusinessException(ErrorCode.USER_PRODUCT_DUPLICATE_NICKNAME);
        }
        userProductRepository.save(userProduct);
    }
}








