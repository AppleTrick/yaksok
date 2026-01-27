package com.ssafy.yaksok.product.entity;

import com.ssafy.yaksok.ingredient.entity.Ingredient;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 제품-성분 중간 테이블
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        name = "product_ingredient",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_product_ingredient",
                        columnNames = {"product_id", "ingredient_id"}
                )
        }
)
public class ProductIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "ingredient_amount")
    private BigDecimal ingredientAmount;

    @Column(name = "amount_unit")
    private String amountUnit;

    @Builder
    public ProductIngredient(Product product, Ingredient ingredient, BigDecimal ingredientAmount, String amountUnit) {
        this.product = product;
        this.ingredient = ingredient;
        this.ingredientAmount = ingredientAmount;
        this.amountUnit = amountUnit;
    }


    // ========================================
    // 단위 변환용 Setter 메서드 (추가)
    // ========================================

    /**
     * 성분 수량 업데이트 (단위 변환 후)
     */
    public void setIngredientAmount(BigDecimal ingredientAmount) {
        this.ingredientAmount = ingredientAmount;
    }

    /**
     * 단위 업데이트 (단위 변환 후)
     */
    public void setAmountUnit(String amountUnit) {
        this.amountUnit = amountUnit;
    }
}