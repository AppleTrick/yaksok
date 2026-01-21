package com.ssafy.yaksok.auth.service;

import com.ssafy.yaksok.auth.dto.LoginRequest;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService 단위 테스트")
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtTokenResolver jwtTokenResolver;

    private AuthService authService;

    private final String TEST_EMAIL = "test@example.com";
    private final String TEST_PASSWORD = "password123";
    private final String TEST_NAME = "테스트유저";
    private final Long TEST_USER_ID = 1L;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userService, jwtTokenProvider, jwtTokenResolver);
    }

    @Nested
    @DisplayName("login 메서드")
    class LoginTest {

        @Test
        @DisplayName("로그인 성공 - 사용자 ID 반환")
        void login_Success() {
            // given
            LoginRequest loginRequest = createLoginRequest();
            given(userService.authenticate(TEST_EMAIL, TEST_PASSWORD)).willReturn(TEST_USER_ID);

            // when
            long userId = authService.login(loginRequest);

            // then
            assertThat(userId).isEqualTo(TEST_USER_ID);
            verify(userService).authenticate(TEST_EMAIL, TEST_PASSWORD);
        }
    }

    @Nested
    @DisplayName("KakaoLogin 메서드")
    class KakaoLoginTest {

        @Test
        @DisplayName("카카오 로그인 성공 - 사용자 ID 반환")
        void kakaoLogin_Success() {
            // given
            String kakaoId = "kakao12345";
            given(userService.kakaoAuthenticate(kakaoId)).willReturn(TEST_USER_ID);

            // when
            long userId = authService.KakaoLogin(kakaoId);

            // then
            assertThat(userId).isEqualTo(TEST_USER_ID);
            verify(userService).kakaoAuthenticate(kakaoId);
        }
    }

    @Nested
    @DisplayName("signUp 메서드")
    class SignUpTest {

        @Test
        @DisplayName("일반 회원가입 성공")
        void signUp_Success() {
            // given
            SignupRequest signupRequest = createSignupRequest();

            // when
            authService.signUp(signupRequest);

            // then
            verify(userService).signup(any(User.class));
        }
    }

    @Nested
    @DisplayName("KaKaoSignUp 메서드")
    class KakaoSignUpTest {

        @Test
        @DisplayName("카카오 회원가입 성공")
        void kakaoSignUp_Success() {
            // given
            KakaoUserInfo kakaoUserInfo = createKakaoUserInfo();

            // when
            authService.KaKaoSignUp(kakaoUserInfo);

            // then
            verify(userService).signup(any(User.class));
        }
    }

    // 테스트 헬퍼 메서드
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

    private KakaoUserInfo createKakaoUserInfo() {
        // KakaoUserInfo(kakaoId, email, nickname)
        return new KakaoUserInfo("kakao12345", TEST_EMAIL, TEST_NAME);
    }
}
