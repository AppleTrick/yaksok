package com.ssafy.yaksok.global.common.unit;

import com.ssafy.yaksok.global.common.llm.prompt.LLMServiceFacade;
import com.ssafy.yaksok.global.common.llm.prompt.UnitConversionPrompt;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

/**
 * LLM 기반 단위 변환기
 *
 * 테이블에 없는 비표준 단위를 LLM을 사용하여 변환합니다.
 * Chain의 마지막 Fallback 전략입니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LLMUnitConverter implements UnitConverter {

    private final LLMServiceFacade llmFacade;
    private final UnitConversionPrompt prompt;
    private UnitConverter next;

    @Override
    public boolean canConvert(String fromUnit, String ingredientName) {
        // LLM은 모든 변환 시도 가능 (최종 Fallback)
        return true;
    }

    @Override
    public ConversionResult convert(
            String ingredientName,
            BigDecimal amount,
            String fromUnit
    ) {
        log.info("[LLMUnitConverter] LLM 변환 시도: {} {} {}", amount, fromUnit, ingredientName);

        try {
            Map<String, Object> params = Map.of(
                    "ingredientName", ingredientName,
                    "amount", amount.toString(),
                    "fromUnit", fromUnit
            );

            UnitConversionResponse response = llmFacade.query(
                    prompt,
                    params,
                    UnitConversionResponse.class
            );

            if (response.isSuccess()) {
                log.info("[LLMUnitConverter] 변환 성공: {} {} → {} {}",
                        amount, fromUnit, response.getAmount(), response.getUnit());

                return ConversionResult.success(
                        response.getAmount(),
                        response.getUnit(),
                        getConverterName()
                );
            } else {
                log.warn("[LLMUnitConverter] LLM 변환 실패: {}", response.getError());
                return ConversionResult.failed(
                        response.getError(),
                        getConverterName()
                );
            }

        } catch (Exception e) {
            log.error("[LLMUnitConverter] LLM 호출 실패: {}", e.getMessage());

            // 마지막 변환기이므로 실패 반환
            return ConversionResult.failed(
                    "LLM 변환 실패: " + e.getMessage(),
                    getConverterName()
            );
        }
    }

    @Override
    public void setNext(UnitConverter next) {
        this.next = next;
    }

    @Override
    public String getConverterName() {
        return "LLMUnitConverter";
    }

    @Override
    public int getPriority() {
        return 100; // 마지막으로 시도 (Fallback)
    }
}