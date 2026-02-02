package com.ssafy.yaksok.ingredient.repository;

import com.ssafy.yaksok.ingredient.entity.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

    boolean existsByIngredientName(String ingredientName);

    Optional<Ingredient> findByIngredientName(String ingredientName);

    /**
     * 성분명으로 검색 (부분 일치, 대소문자 무시)
     * OcrAnalysisService에서 과복용 분석 시 사용
     */
    @Query("SELECT i FROM Ingredient i WHERE LOWER(i.ingredientName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Ingredient> findByIngredientNameContaining(@Param("name") String name);

}