package com.ssafy.yaksok.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.auth.client.KakaoOAuthClient;
import com.ssafy.yaksok.auth.dto.LoginRequest;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.auth.service.AuthService;
import com.ssafy.yaksok.global.util.CookieUtil;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController 테스트 (Standalone)")
class AuthControllerTest {

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // === 의존성 Mock ===
    @Mock
    private AuthService authService;

    @Mock
    private KakaoOAuthClient kakaoOAuthClient;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private CookieUtil cookieUtil;

    // === 테스트 대상 Controller ===
    @InjectMocks
    private AuthController authController;

    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_PASSWORD = "password123";
    private static final String TEST_NAME = "테스트유저";
    private static final Long TEST_USER_ID = 1L;
    private static final String TEST_TOKEN = "test.jwt.token";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(authController)
                .build();
    }

    // ================= 회원가입 =================
    @Nested
    @DisplayName("POST /api/v1/auth/signup")
    class SignupApiTest {

        @Test
        @DisplayName("회원가입 성공")
        void signup_Success() throws Exception {
            SignupRequest request = createSignupRequest();
            doNothing().when(authService).signUp(any(SignupRequest.class));

            mockMvc.perform(post("/api/v1/auth/signup")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }

    // ================= 로그인 =================
    @Nested
    @DisplayName("POST /api/v1/auth/login")
    class LoginApiTest {

        @Test
        @DisplayName("로그인 성공 - 토큰 쿠키 반환")
        void login_Success() throws Exception {
            LoginRequest request = createLoginRequest();
            User user = User.createLocalUser(TEST_EMAIL, TEST_PASSWORD, TEST_NAME, null, null);
            setUserId(user, TEST_USER_ID);

            ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", TEST_TOKEN)
                    .httpOnly(true)
                    .path("/")
                    .maxAge(3600)
                    .build();

            given(authService.login(any(LoginRequest.class))).willReturn(user);
            given(jwtTokenProvider.createAccessToken(anyLong())).willReturn(TEST_TOKEN);
            given(cookieUtil.createAccessToken(anyString())).willReturn(accessTokenCookie);

            mockMvc.perform(post("/api/v1/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value(TEST_NAME))
                    .andExpect(header().exists("Set-Cookie"));
        }
    }

    // ================= 로그아웃 =================
    @Nested
    @DisplayName("POST /api/v1/auth/logout")
    class LogoutApiTest {

        @Test
        @DisplayName("로그아웃 성공 - 쿠키 삭제")
        void logout_Success() throws Exception {
            ResponseCookie deletedCookie = ResponseCookie.from("accessToken", "")
                    .httpOnly(true)
                    .path("/")
                    .maxAge(0)
                    .build();

            given(cookieUtil.deleteAccessToken()).willReturn(deletedCookie);

            mockMvc.perform(post("/api/v1/auth/logout"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(header().exists("Set-Cookie"));
        }
    }

    private void setUserId(User user, Long id) {
        try {
            java.lang.reflect.Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ================= 테스트 헬퍼 =================
    private LoginRequest createLoginRequest() {
        LoginRequest request = new LoginRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword(TEST_PASSWORD);
        return request;
    }

    private SignupRequest createSignupRequest() {
        SignupRequest request = new SignupRequest();
        request.setEmail(TEST_EMAIL);
        request.setPassword(TEST_PASSWORD);
        request.setName(TEST_NAME);
        request.setAgeGroup("20대");
        request.setGender("M");
        return request;
    }
}
