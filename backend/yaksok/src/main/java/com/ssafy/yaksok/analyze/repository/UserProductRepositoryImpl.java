package com.ssafy.yaksok.analyze.repository;

import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.ssafy.yaksok.analyze.domain.dto.IngredientSummary;
import com.ssafy.yaksok.analyze.domain.entity.QIngredient;
import com.ssafy.yaksok.analyze.domain.entity.QProductIngredient;
import com.ssafy.yaksok.analyze.domain.entity.QUserProduct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

/**
 * UserProduct QueryDSL Repository 구현체
 */
@Repository
@RequiredArgsConstructor
public class UserProductRepositoryImpl implements UserProductRepositoryCustom {

        private final JPAQueryFactory queryFactory;

        private final QUserProduct userProduct = QUserProduct.userProduct;
        private final QProductIngredient productIngredient = QProductIngredient.productIngredient;
        private final QIngredient ingredient = QIngredient.ingredient;

        @Override
        public List<IngredientSummary> findIngredientSummaryByUserId(Long userId) {
                // dose_amount가 null이면 1.0으로 처리
                NumberExpression<BigDecimal> doseAmount = userProduct.doseAmount.coalesce(BigDecimal.ONE);

                // 총 섭취량 계산: ingredient_amount × daily_dose × dose_amount
                NumberExpression<BigDecimal> totalAmount = productIngredient.ingredientAmount
                                .multiply(userProduct.dailyDose)
                                .multiply(doseAmount);

                return queryFactory
                                .select(Projections.constructor(IngredientSummary.class,
                                                ingredient.id,
                                                ingredient.ingredientName,
                                                totalAmount.sum(),
                                                productIngredient.amountUnit,
                                                ingredient.maxIntakeValue,
                                                ingredient.minIntakeValue))
                                .from(userProduct)
                                .join(productIngredient).on(userProduct.product.id.eq(productIngredient.product.id))
                                .join(ingredient).on(productIngredient.ingredient.id.eq(ingredient.id))
                                .where(
                                                userProduct.user.id.eq(userId),
                                                userProduct.active.isTrue())
                                .groupBy(
                                                ingredient.id,
                                                ingredient.ingredientName,
                                                productIngredient.amountUnit,
                                                ingredient.maxIntakeValue,
                                                ingredient.minIntakeValue)
                                .fetch();
        }

        @Override
        public List<IngredientSummary> findIngredientsByProductId(Long productId, Integer dailyDose) {
                // 총 섭취량 계산: ingredient_amount × daily_dose
                NumberExpression<BigDecimal> totalAmount = productIngredient.ingredientAmount
                                .multiply(Expressions.constant(new BigDecimal(dailyDose)));

                return queryFactory
                                .select(Projections.constructor(IngredientSummary.class,
                                                ingredient.id,
                                                ingredient.ingredientName,
                                                totalAmount,
                                                productIngredient.amountUnit,
                                                ingredient.maxIntakeValue,
                                                ingredient.minIntakeValue))
                                .from(productIngredient)
                                .join(ingredient).on(productIngredient.ingredient.id.eq(ingredient.id))
                                .where(productIngredient.product.id.eq(productId))
                                .fetch();
        }
}
