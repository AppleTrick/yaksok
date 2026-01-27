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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_member_id", nullable = false)
    private User targetMember;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    private String nickname;

    @Column(nullable = false)
    private Integer dailyDose;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal doseAmount;

    @Column(nullable = false)
    private String doseUnit;

    private LocalDate startDate;

    private LocalDate endDate;

    @Column(nullable = false)
    private boolean active;

    @Column(updatable = false)
    private LocalDateTime createdAt;


    public static UserProduct create(
            User user,
            User targetMember,
            Product product,
            String nickname,
            Integer dailyDose,
            BigDecimal doseAmount,
            String doseUnit,
            LocalDate startDate,
            LocalDate endDate
    ) {
        UserProduct up = new UserProduct();
        up.user = user;
        up.targetMember = targetMember;
        up.product = product;
        up.nickname = nickname;
        up.dailyDose = dailyDose;
        up.doseAmount = doseAmount;
        up.doseUnit = doseUnit;
        up.startDate = startDate;
        up.endDate = endDate;
        up.active = true;
        up.createdAt = LocalDateTime.now();
        return up;
    }
}

