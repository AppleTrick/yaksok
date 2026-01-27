package com.ssafy.yaksok.product.repository;

import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProductIngredientRepository extends JpaRepository<ProductIngredient, Long> {
    boolean existsByProductAndIngredient(Product product, Ingredient ingredient);

    @Query("""
        select new com.ssafy.yaksok.product.dto.ProductIngredientResponse(
            p.id,
            i.id,
            i.ingredientName,
            pi.ingredientAmount,
            pi.amountUnit
        )
        from ProductIngredient pi
        join pi.product p
        join pi.ingredient i
        where p.id in :productIds
    """)
    List<ProductIngredientResponse> findIngredientsByProductIds(
            List<Long> productIds
    );
}
