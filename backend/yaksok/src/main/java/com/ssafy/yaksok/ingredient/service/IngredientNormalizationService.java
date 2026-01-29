package com.ssafy.yaksok.ingredient.service;

import com.ssafy.yaksok.ingredient.dto.UnitConversionResultDto;
import com.ssafy.yaksok.ingredient.util.IngredientUnitConverter;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

/**
 * 성분 단위 정규화 통합 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class IngredientNormalizationService {

    private final IngredientUnitConversionService llmConversionService;

    // 식약처 표준 단위
    private static final Set<String> STANDARD_UNITS = Set.of("mg", "μg", "g", "mcg");

    /**
     * 제품 성분들의 단위 정규화
     *
     * @param ingredients 제품 성분 목록
     */
    public void normalizeIngredients(List<ProductIngredient> ingredients) {
        log.info("성분 정규화 시작: {}개", ingredients.size());

        int successCount = 0;
        int failCount = 0;

        for (ProductIngredient ingredient : ingredients) {
            try {
                normalizeIngredient(ingredient);
                successCount++;
            } catch (Exception e) {
                failCount++;
                log.error("성분 변환 실패: {} - {}",
                        ingredient.getIngredient().getIngredientName(),
                        e.getMessage());
            }
        }

        log.info("성분 정규화 완료: 성공 {}/{}, 실패 {}",
                successCount, ingredients.size(), failCount);
    }

    /**
     * 단일 성분 정규화
     */
    private void normalizeIngredient(ProductIngredient ingredient) {
        String unit = ingredient.getAmountUnit();
        String name = ingredient.getIngredient().getIngredientName();

        log.debug("성분 정규화: {} {} {}", name, ingredient.getIngredientAmount(), unit);

        // 1단계: 이미 표준 단위?
        if (isStandardUnit(unit)) {
            log.info("이미 표준 단위: {}", unit);
            return;
        }

        // 2단계: IU 단위?
        if ("IU".equalsIgnoreCase(unit)) {
            handleIUConversion(ingredient);
            return;
        }

        // 3단계: 비표준 단위 → LLM
        handleLLMConversion(ingredient);
    }

    /**
     * 표준 단위 체크
     */
    private boolean isStandardUnit(String unit) {
        return STANDARD_UNITS.contains(unit.toLowerCase());
    }

    /**
     * IU 변환 처리 (테이블 사용)
     */
    private void handleIUConversion(ProductIngredient ingredient) {
        log.debug("IU 변환 시작: {}", ingredient.getIngredient().getIngredientName());

        var result = IngredientUnitConverter.convertIUToStandard(
                ingredient.getIngredient().getIngredientName(),
                ingredient.getIngredientAmount());

        if (result.isSuccess()) {
            ingredient.setIngredientAmount(result.getValue());
            ingredient.setAmountUnit(result.getUnit());
            log.info("IU 변환 성공: {} IU → {} {}",
                    ingredient.getIngredientAmount(), result.getValue(), result.getUnit());
        } else {
            // IU 실패 → LLM 폴백
            log.warn("IU 변환 실패, LLM으로 폴백");
            handleLLMConversion(ingredient);
        }
    }

    /**
     * LLM 변환 처리
     */
    private void handleLLMConversion(ProductIngredient ingredient) {
        log.debug("LLM 변환 시작: {}", ingredient.getIngredient().getIngredientName());

        UnitConversionResultDto result = llmConversionService.convertUnit(
                ingredient.getIngredient().getIngredientName(), // 수정
                ingredient.getIngredientAmount(),
                ingredient.getAmountUnit());

        if (result.isSuccess()) {
            ingredient.setIngredientAmount(result.getAmount());
            ingredient.setAmountUnit(result.getUnit());
            log.info("LLM 변환 성공: {} → {} {}",
                    ingredient.getAmountUnit(), result.getAmount(), result.getUnit());
        } else {
            throw new RuntimeException("단위 변환 실패: " + result.getError());
        }
    }
}