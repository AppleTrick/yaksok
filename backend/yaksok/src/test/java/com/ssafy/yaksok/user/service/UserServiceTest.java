package com.ssafy.yaksok.user.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.enums.UserEnums;
import com.ssafy.yaksok.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService 단위 테스트")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private final String TEST_EMAIL = "test@example.com";
    private final String TEST_PASSWORD = "password123";
    private final String TEST_ENCODED_PASSWORD = "encodedPassword123";
    private final String TEST_NAME = "테스트유저";
    private final Long TEST_USER_ID = 1L;

    @BeforeEach
    void setUp() {
        testUser = User.createLocalUser(
                TEST_EMAIL,
                TEST_ENCODED_PASSWORD,
                TEST_NAME,
                UserEnums.AgeGroup.TWENTY,
                UserEnums.Gender.MALE);
    }

    @Nested
    @DisplayName("authenticate 메서드")
    class AuthenticateTest {

        @Test
        @DisplayName("올바른 이메일과 비밀번호로 인증 성공")
        void authenticate_Success() {
            // given
            given(userRepository.findByEmail(TEST_EMAIL)).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD)).willReturn(true);

            // Reflection을 사용하여 id 설정
            setUserId(testUser, TEST_USER_ID);

            // when
            long userId = userService.authenticate(TEST_EMAIL, TEST_PASSWORD).getId();

            // then
            assertThat(userId).isEqualTo(TEST_USER_ID);
            verify(userRepository).findByEmail(TEST_EMAIL);
            verify(passwordEncoder).matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD);
        }

        @Test
        @DisplayName("존재하지 않는 이메일로 인증 실패")
        void authenticate_EmailNotFound() {
            // given
            given(userRepository.findByEmail(TEST_EMAIL)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> userService.authenticate(TEST_EMAIL, TEST_PASSWORD))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_LOGIN_FAIL);

            verify(userRepository).findByEmail(TEST_EMAIL);
            verify(passwordEncoder, never()).matches(anyString(), anyString());
        }

        @Test
        @DisplayName("잘못된 비밀번호로 인증 실패")
        void authenticate_WrongPassword() {
            // given
            given(userRepository.findByEmail(TEST_EMAIL)).willReturn(Optional.of(testUser));
            given(passwordEncoder.matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD)).willReturn(false);

            // when & then
            assertThatThrownBy(() -> userService.authenticate(TEST_EMAIL, TEST_PASSWORD))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_LOGIN_FAIL);

            verify(userRepository).findByEmail(TEST_EMAIL);
            verify(passwordEncoder).matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD);
        }
    }

    @Nested
    @DisplayName("kakaoAuthenticate 메서드")
    class KakaoAuthenticateTest {

        @Test
        @DisplayName("카카오 ID로 인증 성공")
        void kakaoAuthenticate_Success() {
            // given
            String kakaoId = "kakao123";
            User kakaoUser = User.createKakaoUser(
                    TEST_EMAIL,
                    TEST_NAME,
                    kakaoId,
                    UserEnums.AgeGroup.TWENTY,
                    UserEnums.Gender.MALE);
            setUserId(kakaoUser, TEST_USER_ID);

            given(userRepository.findByOauthId(kakaoId)).willReturn(Optional.of(kakaoUser));

            // when
            long userId = userService.kakaoAuthenticate(kakaoId).getId();

            // then
            assertThat(userId).isEqualTo(TEST_USER_ID);
            verify(userRepository).findByOauthId(kakaoId);
        }

        @Test
        @DisplayName("존재하지 않는 카카오 ID로 인증 실패")
        void kakaoAuthenticate_NotFound() {
            // given
            String kakaoId = "invalidKakaoId";
            given(userRepository.findByOauthId(kakaoId)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> userService.kakaoAuthenticate(kakaoId))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.AUTH_OAUTH_LOGIN_FAIL);

            verify(userRepository).findByOauthId(kakaoId);
        }
    }

    @Nested
    @DisplayName("signup 메서드")
    class SignupTest {

        @Test
        @DisplayName("회원가입 성공")
        void signup_Success() {
            // given
            com.ssafy.yaksok.auth.dto.SignupRequest signupRequest = new com.ssafy.yaksok.auth.dto.SignupRequest();
            signupRequest.setEmail(TEST_EMAIL);
            signupRequest.setPassword(TEST_PASSWORD);
            signupRequest.setName(TEST_NAME);
            signupRequest.setGender("M");

            given(userRepository.existsByEmail(TEST_EMAIL)).willReturn(false);
            given(passwordEncoder.encode(TEST_PASSWORD)).willReturn(TEST_ENCODED_PASSWORD);

            // when
            userService.signUp(signupRequest);

            // then
            verify(userRepository).existsByEmail(TEST_EMAIL);
            verify(passwordEncoder).encode(TEST_PASSWORD);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("이미 존재하는 이메일로 회원가입 실패")
        void signup_DuplicateEmail() {
            // given
            com.ssafy.yaksok.auth.dto.SignupRequest signupRequest = new com.ssafy.yaksok.auth.dto.SignupRequest();
            signupRequest.setEmail(TEST_EMAIL);

            given(userRepository.existsByEmail(TEST_EMAIL)).willReturn(true);

            // when & then
            assertThatThrownBy(() -> userService.signUp(signupRequest))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_DUPLICATE_EMAIL);

            verify(userRepository).existsByEmail(TEST_EMAIL);
            verify(passwordEncoder, never()).encode(anyString());
            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("KakaoSignup 메서드")
    class KakaoSignupTest {

        @Test
        @DisplayName("카카오 회원가입 성공")
        void kakaoSignup_Success() {
            // given
            String kakaoId = "kakao123";
            com.ssafy.yaksok.auth.dto.KakaoUserInfo kakaoUserInfo = new com.ssafy.yaksok.auth.dto.KakaoUserInfo(kakaoId,
                    TEST_EMAIL, TEST_NAME);

            given(userRepository.existsByOauthId(kakaoId)).willReturn(false);

            // when
            userService.kakaoSignUp(kakaoUserInfo);

            // then
            verify(userRepository).existsByOauthId(kakaoId);
            verify(userRepository).save(any(User.class));
        }

        @Test
        @DisplayName("이미 등록된 카카오 ID로 회원가입 실패")
        void kakaoSignup_DuplicateOAuthId() {
            // given
            String kakaoId = "kakao123";
            com.ssafy.yaksok.auth.dto.KakaoUserInfo kakaoUserInfo = new com.ssafy.yaksok.auth.dto.KakaoUserInfo(kakaoId,
                    TEST_EMAIL, TEST_NAME);

            given(userRepository.existsByOauthId(kakaoId)).willReturn(true);

            // when & then
            assertThatThrownBy(() -> userService.kakaoSignUp(kakaoUserInfo))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_DUPLICATE_OUATHID);

            verify(userRepository).existsByOauthId(kakaoId);
            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("findByUserEmail 메서드")
    class FindByUserEmailTest {

        @Test
        @DisplayName("이메일로 사용자 조회 성공")
        void findByUserEmail_Success() {
            // given
            given(userRepository.findByEmail(TEST_EMAIL)).willReturn(Optional.of(testUser));

            // when
            User foundUser = userService.findByUserEmail(TEST_EMAIL);

            // then
            assertThat(foundUser.getEmail()).isEqualTo(TEST_EMAIL);
            verify(userRepository).findByEmail(TEST_EMAIL);
        }

        @Test
        @DisplayName("존재하지 않는 이메일로 조회 실패")
        void findByUserEmail_NotFound() {
            // given
            given(userRepository.findByEmail(TEST_EMAIL)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> userService.findByUserEmail(TEST_EMAIL))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);

            verify(userRepository).findByEmail(TEST_EMAIL);
        }
    }

    @Nested
    @DisplayName("findByUserId 메서드")
    class FindByUserIdTest {

        @Test
        @DisplayName("ID로 사용자 조회 성공")
        void findByUserId_Success() {
            // given
            setUserId(testUser, TEST_USER_ID);
            given(userRepository.findById(TEST_USER_ID)).willReturn(Optional.of(testUser));

            // when
            User foundUser = userService.findByUserId(TEST_USER_ID);

            // then
            assertThat(foundUser).isEqualTo(testUser);
            verify(userRepository).findById(TEST_USER_ID);
        }

        @Test
        @DisplayName("존재하지 않는 ID로 조회 실패")
        void findByUserId_NotFound() {
            // given
            given(userRepository.findById(TEST_USER_ID)).willReturn(Optional.empty());

            // when & then
            assertThatThrownBy(() -> userService.findByUserId(TEST_USER_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);

            verify(userRepository).findById(TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("deleteUser 메서드")
    class DeleteUserTest {

        @Test
        @DisplayName("사용자 삭제 성공")
        void deleteUser_Success() {
            // given
            doNothing().when(userRepository).deleteById(TEST_USER_ID);

            // when
            userService.deleteUser(TEST_USER_ID);

            // then
            verify(userRepository).deleteById(TEST_USER_ID);
        }
    }

    @Nested
    @DisplayName("encodePassword 메서드")
    class EncodePasswordTest {

        @Test
        @DisplayName("비밀번호 인코딩 성공")
        void encodePassword_Success() {
            // given
            given(passwordEncoder.encode(TEST_PASSWORD)).willReturn(TEST_ENCODED_PASSWORD);

            // when
            String encodedPassword = userService.encodePassword(TEST_PASSWORD);

            // then
            assertThat(encodedPassword).isEqualTo(TEST_ENCODED_PASSWORD);
            verify(passwordEncoder).encode(TEST_PASSWORD);
        }
    }

    @Nested
    @DisplayName("verifyPassword 메서드")
    class VerifyPasswordTest {

        @Test
        @DisplayName("비밀번호 검증 성공")
        void verifyPassword_Success() {
            // given
            given(passwordEncoder.matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD)).willReturn(true);

            // when
            boolean result = userService.verifyPassword(testUser, TEST_PASSWORD);

            // then
            assertThat(result).isTrue();
            verify(passwordEncoder).matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD);
        }

        @Test
        @DisplayName("비밀번호 검증 실패")
        void verifyPassword_Failure() {
            // given
            given(passwordEncoder.matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD)).willReturn(false);

            // when
            boolean result = userService.verifyPassword(testUser, TEST_PASSWORD);

            // then
            assertThat(result).isFalse();
            verify(passwordEncoder).matches(TEST_PASSWORD, TEST_ENCODED_PASSWORD);
        }
    }

    // Reflection을 사용하여 User 엔티티의 id 필드 설정
    private void setUserId(User user, Long id) {
        try {
            java.lang.reflect.Field idField = User.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(user, id);
        } catch (NoSuchFieldException | IllegalAccessException e) {
            throw new RuntimeException("Failed to set user id via reflection", e);
        }
    }
}
