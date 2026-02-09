import { MealCategory } from '../types';

/**
 * 프론트엔드 MealCategory를 백엔드 API 카테고리로 변환
 * @param category - 프론트엔드 카테고리
 * @returns 백엔드 API 카테고리
 */
export const mealCategoryToApiCategory = (
    category: MealCategory
): 'BEFOREMEAL' | 'AFTERMEAL' | 'BEFORESLEEP' => {
    const mapping: Record<MealCategory, 'BEFOREMEAL' | 'AFTERMEAL' | 'BEFORESLEEP'> = {
        'empty_stomach': 'BEFOREMEAL',
        'post_meal': 'AFTERMEAL',
        'pre_sleep': 'BEFORESLEEP'
    };
    return mapping[category];
};

/**
 * 백엔드 API 카테고리를 프론트엔드 MealCategory로 변환
 * @param category - 백엔드 API 카테고리
 * @returns 프론트엔드 카테고리
 */
export const apiCategoryToMealCategory = (
    category: 'BEFOREMEAL' | 'AFTERMEAL' | 'BEFORESLEEP'
): MealCategory => {
    const mapping: Record<string, MealCategory> = {
        'BEFOREMEAL': 'empty_stomach',
        'AFTERMEAL': 'post_meal',
        'BEFORESLEEP': 'pre_sleep'
    };
    return mapping[category];
};

