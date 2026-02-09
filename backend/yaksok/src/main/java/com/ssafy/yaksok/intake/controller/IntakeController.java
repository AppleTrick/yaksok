package com.ssafy.yaksok.intake.controller;

import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.intake.dto.IntakeCheckRequest;
import com.ssafy.yaksok.intake.dto.IntakeResponse;
import com.ssafy.yaksok.intake.service.IntakeService;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/intakes")
@RequiredArgsConstructor
public class IntakeController {

    private final IntakeService intakeService;

    /**
     * 오늘의 복용 목록 조회
     * GET /api/v1/intakes/today
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<IntakeResponse>>> getTodayIntakes(
            @AuthenticationPrincipal UserPrincipal principal) {

        Long userId = principal.getUserId();
        LocalDate today = LocalDate.now();

        log.info("오늘의 복용 목록 요청: User={}, Date={}", userId, today);

        List<IntakeResponse> intakes = intakeService.getDailyIntakes(userId, today);

        return ResponseUtil.ok(intakes);
    }

    /**
     * 복용 체크 (active = true로 변경)
     * POST /api/v1/intakes/check
     */
    @PostMapping("/check")
    public ResponseEntity<ApiResponse<Void>> checkIntake(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody IntakeCheckRequest request) {

        Long userId = principal.getUserId();
        Long userProductId = request.getSupplementId();

        log.info("복용 체크 요청: userId={}, userProductId={}", userId, userProductId);

        intakeService.checkIntake(userId, userProductId);

        return ResponseUtil.ok();
    }
}