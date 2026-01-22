package com.ssafy.yaksok.controller;

import com.ssafy.yaksok.domain.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.domain.dto.SimulationRequest;
import com.ssafy.yaksok.service.OverdoseCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 과복용 체크 Controller
 */
@RestController
@RequestMapping("/api/overdose")
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
    public ResponseEntity<OverdoseCheckResponse> checkOverdose(@RequestParam Long userId) {
        OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 기존 복용 정보 + 추가 제품을 함께 계산하여 과복용 시뮬레이션
     * 
     * @param request 시뮬레이션 요청 (userId + 추가 제품 목록)
     * @return 성분별 과복용 boolean 목록
     */
    @PostMapping("/simulate")
    public ResponseEntity<OverdoseCheckResponse> simulateOverdose(@RequestBody SimulationRequest request) {
        OverdoseCheckResponse response = overdoseCheckService.checkOverdoseWithSimulation(
                request.getUserId(),
                request.getAdditionalProducts());
        return ResponseEntity.ok(response);
    }
}
