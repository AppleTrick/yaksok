package com.ssafy.yaksok.analyze.controller;

import com.ssafy.yaksok.analyze.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.analyze.dto.SimulationProductRequest;
import com.ssafy.yaksok.analyze.service.OverdoseCheckService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 과복용 체크 Controller
 */
@RestController
@RequestMapping("/api/v1/analyze/overdose")
@RequiredArgsConstructor
public class OverdoseController {

    private final OverdoseCheckService overdoseCheckService;

    /**
     * 사용자의 성분별 과복용 여부 확인
     *
     * @param userId 사용자 ID
     * @return 성분별 과복용 boolean 목록
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<OverdoseCheckResponse>> checkOverdose(@RequestParam Long userId) {
        OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);
        return ResponseUtil.ok(response);
    }

    /**
     * 시뮬레이션 포함 과복용 체크
     * 기존 복용 제품 + 추가 예정 제품을 함께 계산
     *
     * @param userId             사용자 ID
     * @param additionalProducts 추가할 제품 목록
     * @return 성분별 과복용 boolean 목록
     */
    @PostMapping("/simulate")
    public ResponseEntity<ApiResponse<OverdoseCheckResponse>> checkOverdoseWithaddProduct(
            @RequestParam Long userId,
            @RequestBody List<SimulationProductRequest> additionalProducts) {
        OverdoseCheckResponse response = overdoseCheckService.checkOverdoseWithaddProduct(userId, additionalProducts);
        return ResponseUtil.ok(response);
    }
}
