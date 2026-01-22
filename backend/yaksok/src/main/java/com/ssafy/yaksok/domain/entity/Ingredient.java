package com.ssafy.yaksok.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 성분 Entity
 */
@Entity
@Table(name = "ingredient")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ingredient_name", unique = true)
    private String ingredientName;

    @Column(name = "min_intake_value")
    private BigDecimal minIntakeValue;

    @Column(name = "max_intake_value")
    private BigDecimal maxIntakeValue;

    @Column(name = "base_unit")
    private String baseUnit;

    @Column(name = "display_unit")
    private String displayUnit;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
