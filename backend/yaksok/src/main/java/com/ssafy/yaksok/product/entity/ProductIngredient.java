package com.ssafy.yaksok.product.entity;

import com.ssafy.yaksok.ingredient.entity.Ingredient;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "product_ingredient")
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
}
