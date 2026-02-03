package com.ssafy.yaksok.global.common.llm.prompt;

import java.util.Map;

/**
 * LLM 프롬프트 템플릿 인터페이스
 *
 * 다양한 용도의 프롬프트를 일관된 방식으로 관리합니다.
 */
public interface PromptTemplate {

    /**
     * 파라미터를 사용하여 프롬프트 생성
     *
     * @param parameters 템플릿 변수
     * @return 완성된 프롬프트
     */
    String build(Map<String, Object> parameters);

    /**
     * 기본 파라미터 반환
     *
     * @return 기본값이 설정된 파라미터 맵
     */
    default Map<String, Object> getDefaultParameters() {
        return Map.of();
    }

    /**
     * 템플릿 이름
     */
    String getName();

    /**
     * 템플릿 설명
     */
    default String getDescription() {
        return "No description provided";
    }

    /**
     * 필수 파라미터 목록
     */
    default String[] getRequiredParameters() {
        return new String[0];
    }

    /**
     * 파라미터 검증
     */
    default void validateParameters(Map<String, Object> parameters) {
        for (String required : getRequiredParameters()) {
            if (!parameters.containsKey(required) || parameters.get(required) == null) {
                throw new IllegalArgumentException(
                        String.format("필수 파라미터 누락: %s (템플릿: %s)", required, getName())
                );
            }
        }
    }
}