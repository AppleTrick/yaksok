package com.ssafy.yaksok.global.common.text;

import lombok.Getter;
import org.springframework.stereotype.Component;

/**
 * 텍스트 정규화 유틸리티
 *
 * 제품명, 성분명 등의 텍스트를 비교 가능한 형태로 정규화합니다.
 */
@Component
public class TextNormalizer {

    /**
     * 기본 옵션으로 정규화
     */
    public String normalize(String text) {
        return normalize(text, NormalizationOptions.DEFAULT);
    }

    /**
     * 커스텀 옵션으로 정규화
     */
    public String normalize(String text, NormalizationOptions options) {
        if (text == null || text.isEmpty()) {
            return "";
        }

        String result = text;

        // 1. 공백 제거
        if (options.isRemoveWhitespace()) {
            result = result.replaceAll("\\s+", "");
        }

        // 2. 특수문자 제거
        if (options.isRemoveSpecialChars()) {
            result = result.replaceAll("[^가-힣a-zA-Z0-9]", "");
        }

        // 3. 소문자 변환
        if (options.isToLowerCase()) {
            result = result.toLowerCase();
        }

        // 4. 트림
        result = result.trim();

        return result;
    }

    /**
     * 제품명 정규화 (기본값)
     */
    public String normalizeProductName(String productName) {
        return normalize(productName, NormalizationOptions.DEFAULT);
    }

    /**
     * 성분명 정규화 (공백 유지)
     */
    public String normalizeIngredientName(String ingredientName) {
        return normalize(ingredientName, NormalizationOptions.PRESERVE_SPACES);
    }

    /**
     * 정규화 옵션
     */
    @Getter
    public enum NormalizationOptions {
        /**
         * 기본: 공백 제거, 특수문자 제거, 소문자 변환
         */
        DEFAULT(true, true, true),

        /**
         * 공백 유지: 특수문자 제거, 소문자 변환
         */
        PRESERVE_SPACES(false, true, true),

        /**
         * 대소문자 구분: 공백 제거, 특수문자 제거
         */
        CASE_SENSITIVE(true, true, false),

        /**
         * 최소 정규화: 트림만 수행
         */
        MINIMAL(false, false, false);

        private final boolean removeWhitespace;
        private final boolean removeSpecialChars;
        private final boolean toLowerCase;

        NormalizationOptions(boolean removeWhitespace, boolean removeSpecialChars, boolean toLowerCase) {
            this.removeWhitespace = removeWhitespace;
            this.removeSpecialChars = removeSpecialChars;
            this.toLowerCase = toLowerCase;
        }
    }
}