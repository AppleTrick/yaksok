package com.ssafy.yaksok.disease.entity;

import com.ssafy.yaksok.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_disease")
public class UserDisease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "disease_id", nullable = false)
    private Disease disease;

    /**
     * UserDisease 생성 정적 팩토리 메서드
     */
    public static UserDisease create(User user, Disease disease) {
        UserDisease userDisease = new UserDisease();
        userDisease.user = user;
        userDisease.disease = disease;
        return userDisease;
    }
}
