package com.ssafy.yaksok.product.repository;

import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.ingredient.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductIngredientRepository extends JpaRepository<ProductIngredient, Long> {

    boolean existsByProductAndIngredient(Product product, Ingredient ingredient);

    /**
     * 여러 제품의 성분을 한 번에 조회 (Batch fetching)
     */
    @Query("""
        SELECT new com.ssafy.yaksok.product.dto.ProductIngredientResponse(
            p.id,
            i.id,
            i.ingredientName,
            pi.ingredientAmount,
            pi.amountUnit,
            CAST(null AS int)
        )
        FROM ProductIngredient pi
        JOIN pi.product p
        JOIN pi.ingredient i
        WHERE p.id IN :productIds
    """)
    List<ProductIngredientResponse> findIngredientsByProductIds(
            @Param("productIds") List<Long> productIds
    );
}