package com.ssafy.yaksok.global.common.dto;

import lombok.Data;

/**
 * LLM 제품 검증 응답 DTO
 */
@Data
public class ProductVerificationResponse {

    private boolean exists;
    private String confidence;
    private String source;

    /**
     * 신뢰도가 높은지 확인
     */
    public boolean isHighConfidence() {
        return "high".equalsIgnoreCase(confidence);
    }

    /**
     * 존재하고 신뢰도가 높은지 확인
     */
    public boolean isVerified() {
        return exists && isHighConfidence();
    }
}