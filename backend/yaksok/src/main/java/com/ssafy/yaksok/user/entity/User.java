package com.ssafy.yaksok.user.entity;

import com.ssafy.yaksok.user.enums.UserEnums;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import com.ssafy.yaksok.user.enums.UserEnums.UserRole;
import com.ssafy.yaksok.user.enums.UserEnums.UserStatus;
import com.ssafy.yaksok.user.enums.UserEnums.OAuthProvider;

import java.time.LocalDateTime;


@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user")
public class User {

    private static final String SOCIAL_LOGIN_PASSWORD = "SOCIAL_LOGIN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    private OAuthProvider oauthProvider;

    @Column
    private String oauthId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status;

    private LocalDateTime lastLoginAt;

    @Enumerated(EnumType.STRING)
    private UserEnums.AgeGroup ageGroup;

    @Enumerated(EnumType.STRING)
    private UserEnums.Gender gender;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private User(
            String email,
            String password,
            String name,
            OAuthProvider oauthProvider,
            String oauthId,
            UserEnums.AgeGroup ageGroup,
            UserEnums.Gender gender
    ) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = UserRole.USER;
        this.oauthProvider = oauthProvider;
        this.oauthId = oauthId;
        this.status = UserStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
        this.ageGroup = ageGroup;
        this.gender = gender;
    }

    /* =========================
       정적 팩토리
       ========================= */

    public static User createLocalUser(
            String email,
            String encodedPassword,
            String name,
            UserEnums.AgeGroup ageGroup,
            UserEnums.Gender gender
    ) {
        return new User(
                email,
                encodedPassword,
                name,
                null,
                null,
                ageGroup,
                gender
        );
    }

    public static User createKakaoUser(
            String email,
            String name,
            String kakaoId,
            UserEnums.AgeGroup ageGroup,
            UserEnums.Gender gender
    ) {
        return new User(
                email,
                SOCIAL_LOGIN_PASSWORD,
                name,
                OAuthProvider.KAKAO,
                kakaoId,
                ageGroup,
                gender
        );
    }

    /**
     * 사용자 프로필 수정
     *
     * @param name 이름 (null이면 변경하지 않음)
     * @param ageGroup 연령대 (null이면 변경하지 않음)
     * @param gender 성별 (null이면 변경하지 않음)
     */
    public void updateProfile(String name, UserEnums.AgeGroup ageGroup, UserEnums.Gender gender) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name;
        }
        if (ageGroup != null) {
            this.ageGroup = ageGroup;
        }
        if (gender != null) {
            this.gender = gender;
        }
    }
}
