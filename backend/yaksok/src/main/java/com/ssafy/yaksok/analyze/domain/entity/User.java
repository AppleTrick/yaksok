package com.ssafy.yaksok.analyze.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 Entity
 */
@Entity
@Table(name = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    private String password;

    private String name;

    private String role;

    @Column(name = "oauth_provider")
    private String oauthProvider;

    private String status;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "age_group")
    private String ageGroup;

    private String gender;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
