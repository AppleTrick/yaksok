package com.ssafy.yaksok.user.service;

import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.disease.service.DiseaseService;
import com.ssafy.yaksok.disease.service.UserDiseaseService;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.service.ProductIngredientService;
import com.ssafy.yaksok.product.service.UserProductService;
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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final DiseaseService diseaseService;
    private final UserDiseaseService userDiseaseService;
    private final UserProductService userProductService;
    private final ProductIngredientService productIngredientService;
    private final PasswordEncoder passwordEncoder;

    public User authenticate(String email, String rawPassword) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FAIL);
        }

        return user;
    }

    public User kakaoAuthenticate(String kakaoId){
        return userRepository.findByOauthId(kakaoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_OAUTH_LOGIN_FAIL));
    }

    public UsernameResponse getUserName(Long userId){
        User user = findByUserId(userId);

        return new UsernameResponse(user.getName());
    }

    public UserInfoResponse getUserInfoRespone(Long userId){

        return new UserInfoResponse(getUserData(userId), userDiseaseService.getUserDisease(userId),
                diseaseService.findAllDisease(), getUserProducts(userId));
    }

    public UserDataResponse getUserData(Long userId){
        User user = findByUserId(userId);

        return new UserDataResponse(user.getEmail(), user.getName(), user.getAgeGroup(), user.getGender());
    }

    public List<UserProductResponse> getUserProducts(Long userId) {

        // 1. 사용자 영양제 기본 정보
        List<UserProductResponse> userProducts =
                userProductService.getUserProducts(userId);

        if (userProducts.isEmpty()) {
            return List.of();
        }

        // 2. productId 목록 추출
        List<Long> productIds = userProducts.stream()
                .map(UserProductResponse::getProductId)
                .toList();

        // 3. 해당 영양제들의 성분을 한 번에 조회
        List<ProductIngredientResponse> ingredients =
                productIngredientService.findIngredientsByProductIds(productIds);

        // 4. productId 기준으로 그룹핑
        Map<Long, List<ProductIngredientResponse>> ingredientMap =
                ingredients.stream()
                        .collect(Collectors.groupingBy(
                                ProductIngredientResponse::productId
                        ));

        // 5. userProducts에 성분 주입
        userProducts.forEach(up ->
                up.setIngredients(
                        ingredientMap.getOrDefault(up.getProductId(), List.of())
                )
        );

        return userProducts;
    }

    public User getTestUser(){
        return findByUserId(1L);
    }

    public String encodePassword(String password){
        return passwordEncoder.encode(password);
    }

    public boolean verifyPassword(User user, String password){
        return passwordEncoder.matches(password, user.getPassword());
    }

    public boolean existsEmail(String email){
        return userRepository.existsByEmail(email);
    }

    public boolean existsOauthId(String oauthId){
        return userRepository.existsByOauthId(oauthId);
    }

    //CRUD
    public void signUp(SignupRequest request){
        if(existsEmail(request.getEmail())){
            throw new BusinessException(ErrorCode.USER_DUPLICATE_EMAIL);
        }

        User user = User.createLocalUser(request.getEmail(),
                encodePassword(request.getPassword()), request.getName(),
                UserEnums.AgeGroup.from(request.getAgeGroup()), UserEnums.Gender.from(request.getGender()));

        userRepository.save(user);
    }

    public void kakaoSignUp(KakaoUserInfo kakaoUserInfo){
        if(existsOauthId(kakaoUserInfo.getKakaoId())){
            throw new BusinessException(ErrorCode.USER_DUPLICATE_OUATHID);
        }

        User user = User.createKakaoUser(kakaoUserInfo.getEmail(),
                kakaoUserInfo.getNickname(), kakaoUserInfo.getKakaoId(), null, null);

        userRepository.save(user);
    }

    public User findByUserEmail(String email){
        return userRepository.findByEmail(email).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public User findByUserId(long userId){
        return userRepository.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public void updataUser(User user){
        userRepository.save(user);
    }

    public void deleteUser(long userId){
        userRepository.deleteById(userId);
    }
}
