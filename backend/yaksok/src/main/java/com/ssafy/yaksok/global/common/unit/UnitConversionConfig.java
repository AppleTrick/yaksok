package com.ssafy.yaksok.global.common.unit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 단위 변환 Chain 설정
 *
 * Chain of Responsibility Pattern:
 * IUConverter → StandardUnitConverter → LLMUnitConverter
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class UnitConversionConfig {

    /**
     *
     */
    private final IUConverter iuConverter;
    private final StandardUnitConverter standardConverter;
    private final LLMUnitConverter llmConverter;

    /**
     * 단위 변환 체인 구성
     *
     * 우선순위:
     * 1. IUConverter (IU → mg/μg)
     * 2. StandardUnitConverter (표준 단위 확인)
     * 3. LLMUnitConverter (비표준 → 표준, Fallback)
     */
    @Bean
    public UnitConverter unitConverterChain() {
        log.info("단위 변환 체인 구성 시작");

        // Chain 연결
        iuConverter.setNext(standardConverter);
        standardConverter.setNext(llmConverter);

        log.info("단위 변환 체인 구성 완료: {} → {} → {}",
                iuConverter.getConverterName(),
                standardConverter.getConverterName(),
                llmConverter.getConverterName()
        );

        return iuConverter;
    }
}