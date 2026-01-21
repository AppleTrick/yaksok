package com.ssafy.yaksok.product.repository;

import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductIngredientRepository extends JpaRepository<ProductIngredient, Long> {
    boolean existsByProductAndIngredient(Product product, Ingredient ingredient);
}
