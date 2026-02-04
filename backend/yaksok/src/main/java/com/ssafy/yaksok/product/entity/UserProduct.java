package com.ssafy.yaksok.product.entity;

import com.ssafy.yaksok.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_product")
public class UserProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    private String nickname;

    private Integer dailyDose;

    @Column(precision = 10, scale = 2)
    private BigDecimal doseAmount;

    private String doseUnit;

    @Column(nullable = false)
    private boolean active;

    @Column(updatable = false)
    private LocalDateTime createdAt;


    public static UserProduct create(
            User user,
            Product product,
            String nickname,
            Integer dailyDose,
            BigDecimal doseAmount,
            String doseUnit
    ) {
        UserProduct up = new UserProduct();
        up.user = user;
        up.product = product;
        up.nickname = nickname;
        up.dailyDose = dailyDose;
        up.doseAmount = doseAmount;
        up.doseUnit = doseUnit;
        up.active = true;
        up.createdAt = LocalDateTime.now();
        return up;
    }

    public static UserProduct create(User user, String nickname){
        UserProduct up = new UserProduct();
        up.user = user;
        up.product = null;
        up.nickname = nickname;
        up.dailyDose = null;
        up.doseAmount = null;
        up.doseUnit = null;
        up.active = true;
        up.createdAt = LocalDateTime.now();
        return up;
    }
}

