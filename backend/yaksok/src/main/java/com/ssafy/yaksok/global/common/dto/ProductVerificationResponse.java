package com.ssafy.yaksok.global.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * LLM 제품 검증 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductVerificationResponse {

    @JsonProperty("isValid")
    private boolean valid;
    private String reason;
}