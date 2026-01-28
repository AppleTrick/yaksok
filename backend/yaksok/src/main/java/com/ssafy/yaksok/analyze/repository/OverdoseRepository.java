package com.ssafy.yaksok.analyze.repository;

import com.ssafy.yaksok.analyze.dto.IngredientSummary;
import com.ssafy.yaksok.product.entity.UserProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 과복용 체크를 위한 Repository
 */
@Repository
public interface OverdoseRepository extends JpaRepository<UserProduct, Long> {

    /**
     * 사용자의 성분별 일일 섭취량 합산 조회
     */
    @Query("""
                SELECT new com.ssafy.yaksok.analyze.dto.IngredientSummary(
                    i.id,
                    i.ingredientName,
                    CAST(SUM(pi.ingredientAmount * up.dailyDose * COALESCE(up.doseAmount, 1.0)) AS double),
                    pi.amountUnit,
                    CAST(i.maxIntakeValue AS double),
                    CAST(i.minIntakeValue AS double)
                )
                FROM UserProduct up
                JOIN ProductIngredient pi ON up.product.id = pi.product.id
                JOIN Ingredient i ON pi.ingredient.id = i.id
                WHERE up.user.id = :userId AND up.active = true
                GROUP BY i.id, i.ingredientName, pi.amountUnit, i.maxIntakeValue, i.minIntakeValue
            """)
    List<IngredientSummary> findIngredientSummaryByUserId(@Param("userId") Long userId);

    /**
     * 특정 제품의 성분 목록 조회 (시뮬레이션용)
     */
    @Query("""
                SELECT new com.ssafy.yaksok.analyze.dto.IngredientSummary(
                    i.id,
                    i.ingredientName,
                    CAST(pi.ingredientAmount * :dailyDose AS double),
                    pi.amountUnit,
                    CAST(i.maxIntakeValue AS double),
                    CAST(i.minIntakeValue AS double)
                )
                FROM ProductIngredient pi
                JOIN Ingredient i ON pi.ingredient.id = i.id
                WHERE pi.product.id = :productId
            """)
    List<IngredientSummary> findIngredientsByProductId(
            @Param("productId") Long productId,
            @Param("dailyDose") Integer dailyDose);
}
