package com.ssafy.yaksok.user.service;

import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.entity.UserDisease;
import com.ssafy.yaksok.disease.repository.DiseaseRepository;
import com.ssafy.yaksok.disease.repository.UserDiseaseRepository;
import com.ssafy.yaksok.disease.service.DiseaseService;
import com.ssafy.yaksok.disease.service.UserDiseaseService;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.service.ProductIngredientService;
import com.ssafy.yaksok.product.service.UserProductService;
import com.ssafy.yaksok.user.dto.UpdateUserRequest;
import com.ssafy.yaksok.user.dto.UserDataResponse;
import com.ssafy.yaksok.user.dto.UserInfoResponse;
import com.ssafy.yaksok.user.dto.UsernameResponse;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.enums.UserEnums;
import com.ssafy.yaksok.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 사용자 관리 서비스
 *
 * 주요 기능:
 * - 사용자 인증 (로컬/카카오)
 * - 사용자 정보 조회
 * - 사용자 등록/수정/삭제
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 기본은 읽기 전용
public class UserService {

    private final UserRepository userRepository;
    private final DiseaseService diseaseService;
    private final UserDiseaseService userDiseaseService;
    private final UserProductService userProductService;
    private final ProductIngredientService productIngredientService;
    private final PasswordEncoder passwordEncoder;
    private final DiseaseRepository diseaseRepository;
    private final UserDiseaseRepository userDiseaseRepository;

    // ========================================
    // 인증 관련
    // ========================================

    /**
     * 로컬 로그인 인증
     */
    public User authenticate(String email, String rawPassword) {
        log.debug("로컬 로그인 시도: email={}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            log.warn("로그인 실패: 비밀번호 불일치, email={}", email);
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FAIL);
        }

        log.info("로그인 성공: userId={}", user.getId());
        return user;
    }

    /**
     * 카카오 로그인 인증
     */
    public User kakaoAuthenticate(String kakaoId) {
        log.debug("카카오 로그인 시도: kakaoId={}", kakaoId);

        User user = userRepository.findByOauthId(kakaoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_OAUTH_LOGIN_FAIL));

        log.info("카카오 로그인 성공: userId={}", user.getId());
        return user;
    }

    // ========================================
    // 조회 관련
    // ========================================

    /**
     * 사용자 이름 조회
     */
    public UsernameResponse getUserName(Long userId) {
        User user = findByUserId(userId);
        return new UsernameResponse(user.getName());
    }

    /**
     * 사용자 정보 통합 조회
     * - 기본 정보
     * - 질병 정보
     * - 전체 질병 목록
     * - 복용 중인 영양제 목록
     */
    public UserInfoResponse getUserInfoResponse(Long userId) {
        log.debug("사용자 정보 조회: userId={}", userId);

        return new UserInfoResponse(
                getUserData(userId),
                userDiseaseService.getUserDisease(userId),
                diseaseService.findAllDisease(),
                getUserProducts(userId)
        );
    }

    /**
     * 사용자 기본 정보 조회
     */
    public UserDataResponse getUserData(Long userId) {
        User user = findByUserId(userId);

        return new UserDataResponse(
                user.getEmail(),
                user.getName(),
                user.getAgeGroup(),
                user.getGender()
        );
    }

    /**
     * 사용자 복용 영양제 목록 조회 (성분 포함)
     *
     * - Batch fetching으로 성능 최적화
     * - 101개 쿼리 → 2개 쿼리로 감소 (98% 개선)
     */
    public List<UserProductResponse> getUserProducts(Long userId) {
        log.debug("사용자 영양제 목록 조회: userId={}", userId);

        // 1. 사용자 영양제 기본 정보
        List<UserProductResponse> userProducts = userProductService.getUserProducts(userId);

        if (userProducts.isEmpty()) {
            log.debug("복용 중인 영양제 없음: userId={}", userId);
            return List.of();
        }

        // 2. productId 목록 추출
        List<Long> productIds = userProducts.stream()
                .map(UserProductResponse::getProductId)
                .toList();

        // 3. 해당 영양제들의 성분을 한 번에 조회 (Batch fetching)
        List<ProductIngredientResponse> ingredients =
                productIngredientService.findIngredientsByProductIds(productIds);

        // 4. productId 기준으로 그룹핑
        Map<Long, List<ProductIngredientResponse>> ingredientMap = ingredients.stream()
                .collect(Collectors.groupingBy(ProductIngredientResponse::getProductId));

        // 5. userProducts에 성분 주입
        userProducts.forEach(up ->
                up.setIngredients(
                        ingredientMap.getOrDefault(up.getProductId(), List.of())
                )
        );

        log.info("영양제 목록 조회 완료: userId={}, count={}", userId, userProducts.size());
        return userProducts;
    }

    // ========================================
    // 회원가입 (CUD)
    // ========================================

    /**
     * 로컬 회원가입
     */
    @Transactional // 쓰기 작업이므로 @Transactional 필요
    public void signUp(SignupRequest request) {
        log.info("회원가입 시도: email={}", request.getEmail());

        // 중복 체크
        if (existsEmail(request.getEmail())) {
            log.warn("회원가입 실패: 이메일 중복, email={}", request.getEmail());
            throw new BusinessException(ErrorCode.USER_DUPLICATE_EMAIL);
        }

        // User 생성
        User user = User.createLocalUser(
                request.getEmail(),
                encodePassword(request.getPassword()),
                request.getName(),
                UserEnums.AgeGroup.from(request.getAgeGroup()),
                UserEnums.Gender.from(request.getGender())
        );

        userRepository.save(user);
        log.info("회원가입 완료: userId={}", user.getId());
    }

    /**
     * 카카오 회원가입
     */
    @Transactional // 쓰기 작업
    public void kakaoSignUp(KakaoUserInfo kakaoUserInfo) {
        log.info("카카오 회원가입 시도: kakaoId={}", kakaoUserInfo.getKakaoId());

        // 중복 체크
        if (existsOauthId(kakaoUserInfo.getKakaoId())) {
            log.warn("카카오 회원가입 실패: OAuth ID 중복, kakaoId={}", kakaoUserInfo.getKakaoId());
            throw new BusinessException(ErrorCode.USER_DUPLICATE_OUATHID);
        }

        // User 생성
        User user = User.createKakaoUser(
                kakaoUserInfo.getEmail(),
                kakaoUserInfo.getNickname(),
                kakaoUserInfo.getKakaoId(),
                null, // ageGroup
                null  // gender
        );

        userRepository.save(user);
        log.info("카카오 회원가입 완료: userId={}", user.getId());
    }

    // ========================================
    // 수정/삭제
    // ========================================

    /**
     * @deprecated 대신 updateUserProfile()을 사용하세요
     */
    @Deprecated
    @Transactional
    public void updateUser(User user) {
        log.warn("Deprecated 메서드 호출: updateUser() - updateUserProfile() 사용 권장");
        userRepository.save(user);
    }

    /**
     * 사용자 프로필 수정 (질병 정보 포함)
     */
    @Transactional
    public void updateUserProfile(Long userId, UpdateUserRequest request) {
        log.info("유저 정보 수정 시도: userId={}", userId);

        User user = findByUserId(userId);

        // 1. 기본 정보 수정
        UserEnums.AgeGroup ageGroup = request.getAgeGroup() != null
                ? UserEnums.AgeGroup.from(request.getAgeGroup())
                : null;

        UserEnums.Gender gender = request.getGender() != null
                ? UserEnums.Gender.from(request.getGender())
                : null;

        user.updateProfile(request.getName(), ageGroup, gender);

        // 2. 질병 정보 수정 (user 객체 전달하여 중복 조회 방지)
        if (request.getDiseaseIds() != null) {
            updateUserDiseases(user, request.getDiseaseIds());
        }

        log.info("유저 정보 수정 완료: userId={}, name={}, diseases={}",
                userId, request.getName(), request.getDiseaseIds());
    }

    /**
     * 사용자 질병 정보 업데이트
     * 기존 질병을 모두 삭제하고 새로운 질병 목록으로 교체
     *
     * @param user 사용자 엔티티 (중복 조회 방지)
     * @param diseaseIds 질병 ID 목록
     */
    private void updateUserDiseases(User user, List<Long> diseaseIds) {
        log.info("질병 정보 업데이트 시작: userId={}, diseaseIds={}", user.getId(), diseaseIds);

        // 1. 기존 질병 정보 삭제
        userDiseaseRepository.deleteAllByUserId(user.getId());

        // 2. 새로운 질병 정보 저장
        if (!diseaseIds.isEmpty()) {
            List<UserDisease> userDiseases = diseaseIds.stream()
                    .map(diseaseId -> {
                        Disease disease = diseaseRepository.findById(diseaseId)
                                .orElseThrow(() -> new BusinessException(ErrorCode.DISEASE_NOT_FOUND));
                        return UserDisease.create(user, disease);
                    })
                    .toList();

            userDiseaseRepository.saveAll(userDiseases);
        }

        log.info("질병 정보 업데이트 완료: userId={}, diseaseCount={}", user.getId(), diseaseIds.size());
    }

    /**
     * 사용자 삭제
     */
    @Transactional // 쓰기 작업
    public void deleteUser(Long userId) {
        log.warn("사용자 삭제: userId={}", userId);
        userRepository.deleteById(userId);
    }

    // ========================================
    // Helper 메서드
    // ========================================

    /**
     * 이메일로 사용자 조회
     */
    public User findByUserEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * ID로 사용자 조회
     */
    public User findByUserId(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * 이메일 중복 체크
     */
    public boolean existsEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * OAuth ID 중복 체크
     */
    public boolean existsOauthId(String oauthId) {
        return userRepository.existsByOauthId(oauthId);
    }

    /**
     * 비밀번호 암호화
     */
    public String encodePassword(String password) {
        return passwordEncoder.encode(password);
    }

    /**
     * 비밀번호 검증
     */
    public boolean verifyPassword(User user, String password) {
        return passwordEncoder.matches(password, user.getPassword());
    }

    /**
     * 테스트용 사용자 조회
     * TODO: 프로덕션에서는 제거 필요
     */
    @Deprecated
    public User getTestUser() {
        return findByUserId(1L);
    }
}