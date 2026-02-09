package com.ssafy.yaksok.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@AllArgsConstructor
public class UserProductResponse {

    private Long userProductId;
    private Long productId;
    private String productName;
    private String nickname;
    private Integer dailyDose;
    private BigDecimal doseAmount;
    private String doseUnit;
    private Boolean active;

    private List<ProductIngredientResponse> ingredients = List.of();

    public UserProductResponse(
            Long userProductId,
            Long productId,
            String productName,
            String nickname,
            Integer dailyDose,
            BigDecimal doseAmount,
            String doseUnit,
            Boolean active) {
        this.userProductId = userProductId;
        this.productId = productId;
        this.productName = productName;
        this.nickname = nickname;
        this.dailyDose = dailyDose;
        this.doseAmount = doseAmount;
        this.doseUnit = doseUnit;
        this.active = active;
    }

    public void setIngredients(List<ProductIngredientResponse> ingredients) {
        this.ingredients = ingredients;
    }
}
