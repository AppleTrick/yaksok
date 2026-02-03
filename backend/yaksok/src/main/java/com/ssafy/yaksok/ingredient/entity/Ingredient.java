package com.ssafy.yaksok.ingredient.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "ingredient")
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

    @Column(name = "display_unit")
    private String displayUnit;

    @Builder
    public Ingredient(Long id, String ingredientName, BigDecimal minIntakeValue, BigDecimal maxIntakeValue,
                      String displayUnit) {
        this.id = id;
        this.ingredientName = ingredientName;
        this.minIntakeValue = minIntakeValue;
        this.maxIntakeValue = maxIntakeValue;
        this.displayUnit = displayUnit;
    }

    /**
     * 일일 권장 섭취량을 반환하는 메서드
     * minIntakeValue를 Double로 변환하여 반환
     */
    public Double getRecommendedAmount() {
        if (minIntakeValue == null) {
            return null;
        }
        return minIntakeValue.doubleValue();
    }
}