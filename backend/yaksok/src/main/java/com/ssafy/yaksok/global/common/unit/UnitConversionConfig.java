package com.ssafy.yaksok.global.common.unit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class UnitConversionConfig {

    private final IUConverter iuConverter;
    private final StandardUnitConverter standardConverter;
    private final LLMUnitConverter llmConverter;

    @Bean
    @Primary // [핵심] 여러 UnitConverter 중 이 체인을 기본값으로 사용
    public UnitConverter unitConverterChain() {
        log.info("단위 변환 체인 구성 시작");

        iuConverter.setNext(standardConverter);
        standardConverter.setNext(llmConverter);

        return iuConverter;
    }
}