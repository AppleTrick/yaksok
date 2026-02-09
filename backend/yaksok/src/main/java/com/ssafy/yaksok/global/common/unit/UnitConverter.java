package com.ssafy.yaksok.global.common.unit;

import java.math.BigDecimal;

/**
 * 단위 변환기 인터페이스 (Chain of Responsibility Pattern)
 *
 * 다양한 단위 변환 전략을 체인으로 연결하여 순차적으로 시도합니다.
 */
public interface UnitConverter {

    /**
     * 변환 가능 여부 체크
     *
     * @param fromUnit 변환할 단위
     * @param ingredientName 성분명
     * @return 변환 가능 여부
     */
    boolean canConvert(String fromUnit, String ingredientName);

    /**
     * 단위 변환 수행
     *
     * @param ingredientName 성분명
     * @param amount 수량
     * @param fromUnit 현재 단위
     * @return 변환 결과
     */
    ConversionResult convert(
            String ingredientName,
            BigDecimal amount,
            String fromUnit
    );

    /**
     * 다음 변환기 설정 (Chain of Responsibility)
     *
     * @param next 다음 변환기
     */
    void setNext(UnitConverter next);

    /**
     * 변환기 이름
     */
    String getConverterName();

    /**
     * 변환기 우선순위 (낮을수록 먼저 시도)
     */
    default int getPriority() {
        return 100;
    }
}