package com.ssafy.yaksok.product.dto;

import java.math.BigDecimal;

public record ProductIngredientResponse(
        Long productId,
        Long ingredientId,
        String name,
        BigDecimal amount,
        String unit
) {}
