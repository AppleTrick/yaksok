package com.ssafy.yaksok.user.controller;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.entity.UserDisease;
import com.ssafy.yaksok.disease.repository.DiseaseRepository;
import com.ssafy.yaksok.disease.repository.UserDiseaseRepository;
import com.ssafy.yaksok.global.handler.GlobalExceptionHandler;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import com.ssafy.yaksok.ingredient.repository.IngredientRepository;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.repository.ProductIngredientRepository;
import com.ssafy.yaksok.product.repository.ProductRepository;
import com.ssafy.yaksok.product.repository.UserProductRepository;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.enums.UserEnums;
import com.ssafy.yaksok.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@DisplayName("UserController DB 연동 통합 테스트")
class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DiseaseRepository diseaseRepository;

    @Autowired
    private UserDiseaseRepository userDiseaseRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private ProductIngredientRepository productIngredientRepository;

    @Autowired
    private UserProductRepository userProductRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        // 1. 테스트 사용자 생성 (회원가입 시나리오)
        testUser = User.createLocalUser(
                "integration@test.com",
                "password",
                "통합테스트유저",
                UserEnums.AgeGroup.THIRTY,
                UserEnums.Gender.FEMALE);
        userRepository.save(testUser);

        // 2. 인증 설정
        UserPrincipal principal = new UserPrincipal(testUser.getId(), "USER");
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GET /api/v1/user/info - DB에 저장된 모든 데이터가 정상적으로 반환되는지 확인")
    void getUserInfo_Integration_Success() throws Exception {
        // given: DB에 실제 데이터 시딩

        // 질병 데이터
        Disease userDisease = Disease.builder().sickName("Integration Disease 1").build();
        Disease otherDisease = Disease.builder().sickName("Integration Disease 2").build();
        diseaseRepository.saveAll(List.of(userDisease, otherDisease));

        // 사용자-질병 연결 (Reflection 사용)
        UserDisease ud = createUserDisease(testUser, userDisease);
        userDiseaseRepository.save(ud);

        // 영양제 및 성분 데이터
        Product product = Product.builder()
                .prdlstNm("Integration Product")
                .primaryFnclty("Test Functionality")
                .build();
        productRepository.save(product);

        Ingredient ingredient = Ingredient.builder()
                .ingredientName("Integration Ingredient")
                .displayUnit("mg")
                .build();
        ingredientRepository.save(ingredient);

        ProductIngredient pi = ProductIngredient.builder()
                .product(product)
                .ingredient(ingredient)
                .ingredientAmount(new BigDecimal("100.50"))
                .amountUnit("mg")
                .build();
        productIngredientRepository.save(pi);

        // 사용자 영양제 등록
        UserProduct up = UserProduct.create(
                testUser, testUser, product, "내약", 2,
                new BigDecimal("1.0"), "캡슐",
                LocalDate.now(), LocalDate.now().plusMonths(1));
        userProductRepository.save(up);

        // when & then
        mockMvc.perform(get("/api/v1/user/info"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                // 사용자 데이터 검증
                .andExpect(jsonPath("$.data.userDataResponse.email").value("integration@test.com"))
                .andExpect(jsonPath("$.data.userDataResponse.name").value("통합테스트유저"))
                // 질병 데이터 검증
                .andExpect(jsonPath("$.data.userDiseases[0].sickName").value("Integration Disease 1"))
                .andExpect(jsonPath("$.data.allDiseases.length()").value(2))
                // 영양제 및 성분 데이터 검증
                .andExpect(jsonPath("$.data.userProducts[0].productName").value("Integration Product"))
                .andExpect(jsonPath("$.data.userProducts[0].nickname").value("내약"))
                .andExpect(jsonPath("$.data.userProducts[0].ingredients[0].name").value("Integration Ingredient"))
                .andExpect(jsonPath("$.data.userProducts[0].ingredients[0].amount").value(100.50));
    }

    @Test
    @DisplayName("GET /api/v1/user/me - DB 연동 이름 조회 확인")
    void getUserName_Integration_Success() throws Exception {
        mockMvc.perform(get("/api/v1/user/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("통합테스트유저"));
    }

    // UserDisease의 접근 제한된 필드 설정을 위한 Reflection 헬퍼
    private UserDisease createUserDisease(User user, Disease disease) throws Exception {
        UserDisease ud = (UserDisease) Class.forName("com.ssafy.yaksok.disease.entity.UserDisease")
                .getDeclaredConstructor().newInstance();

        setField(ud, "user", user);
        setField(ud, "disease", disease);

        return ud;
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
