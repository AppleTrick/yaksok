package com.ssafy.yaksok.user.controller;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.global.handler.GlobalExceptionHandler;
import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.security.config.SecurityConfig;
import com.ssafy.yaksok.security.filter.JwtAuthenticationFilter;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import com.ssafy.yaksok.user.dto.UserDataResponse;
import com.ssafy.yaksok.user.dto.UserInfoResponse;
import com.ssafy.yaksok.user.dto.UsernameResponse;
import com.ssafy.yaksok.user.enums.UserEnums;
import com.ssafy.yaksok.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import({ SecurityConfig.class, GlobalExceptionHandler.class, JwtAuthenticationFilter.class })
@AutoConfigureMockMvc(addFilters = true) // 필터 체인 명시적 활성화
@DisplayName("UserController 통합 연동 및 데이터 정합성 테스트")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenResolver jwtTokenResolver;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    private static final Long TEST_USER_ID = 1L;
    private static final String TEST_NAME = "테스트유저";

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext(); // 테스트 간 격리 보장
    }

    private void authenticate() {
        UserPrincipal principal = new UserPrincipal(TEST_USER_ID, "USER");
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GET /api/v1/user/me - 성공: 이름 조회")
    void getUserName_Success() throws Exception {
        // given
        authenticate();
        given(userService.getUserName(anyLong())).willReturn(new UsernameResponse(TEST_NAME));

        // when & then
        mockMvc.perform(get("/api/v1/user/me"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value(TEST_NAME));
    }

    @Test
    @DisplayName("GET /api/v1/user/info - 성공: 상세 정보 필드 전수 검증")
    void getUserInfo_Success() throws Exception {
        // given
        authenticate();

        UserDataResponse userData = UserDataResponse.builder()
                .email("yaksok@ssafy.com")
                .name(TEST_NAME)
                .ageGroup(UserEnums.AgeGroup.TWENTY)
                .gender(UserEnums.Gender.MALE)
                .build();

        Disease userDisease = Disease.builder().id(10L).sickName("비염").build();
        Disease allDisease = Disease.builder().id(20L).sickName("감기").build();

        ProductIngredientResponse ingredient = new ProductIngredientResponse(
                300L, 400L, "비타민C", new BigDecimal("500.00"), "mg");

        UserProductResponse userProduct = new UserProductResponse(
                100L, 200L, "멀티비타민", "매일먹는비타민", 1,
                new BigDecimal("1.0"), "정", true);
        userProduct.setIngredients(List.of(ingredient));

        UserInfoResponse response = new UserInfoResponse(
                userData,
                List.of(userDisease),
                List.of(allDisease),
                List.of(userProduct));

        given(userService.getUserInfoRespone(anyLong())).willReturn(response);

        // when & then
        mockMvc.perform(get("/api/v1/user/info"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userDataResponse.email").value("yaksok@ssafy.com"))
                .andExpect(jsonPath("$.data.userDataResponse.name").value(TEST_NAME))
                .andExpect(jsonPath("$.data.userDiseases[0].sickName").value("비염"))
                .andExpect(jsonPath("$.data.userProducts[0].productName").value("멀티비타민"))
                .andExpect(jsonPath("$.data.userProducts[0].ingredients[0].name").value("비타민C"));
    }

    @Test
    @DisplayName("GET /api/v1/user/info - 실패: 인증 정보 없음 (403 Forbidden)")
    void getUserInfo_Forbidden() throws Exception {
        // given: No authentication set
        SecurityContextHolder.clearContext();

        // when & then
        mockMvc.perform(get("/api/v1/user/info"))
                .andDo(print())
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/user/info - 실패: 사용자를 찾을 수 없음 (404 Not Found)")
    void getUserInfo_NotFound() throws Exception {
        // given
        authenticate();
        given(userService.getUserInfoRespone(anyLong()))
                .willThrow(new BusinessException(ErrorCode.USER_NOT_FOUND));

        // when & then
        mockMvc.perform(get("/api/v1/user/info"))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("USER_404"));
    }

    @Test
    @DisplayName("GET /api/v1/user/info - 실패: 서버 내부 오류 (500 Internal Server Error)")
    void getUserInfo_InternalError() throws Exception {
        // given
        authenticate();
        given(userService.getUserInfoRespone(anyLong()))
                .willThrow(new RuntimeException("Unexpected error"));

        // when & then
        mockMvc.perform(get("/api/v1/user/info"))
                .andDo(print())
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("COMMON_500"));
    }
}
