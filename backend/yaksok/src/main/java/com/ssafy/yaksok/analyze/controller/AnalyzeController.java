package com.ssafy.yaksok.analyze.controller;

import com.ssafy.yaksok.analyze.dto.response.SupplementAnalysisResponse;
import com.ssafy.yaksok.analyze.service.AnalyzeService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 영양제 분석 컨트롤러
 * 
 * 카메라로 촬영된 영양제 이미지를 분석하고
 * 화면 표시용 박스 데이터와 상세 리포트 데이터를 통합하여 제공합니다.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/analyze")
@RequiredArgsConstructor
public class AnalyzeController {

    private final AnalyzeService analyzeService;

    @PostMapping
    public ResponseEntity<ApiResponse<SupplementAnalysisResponse>> analyzeSupplement(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {

        // 1. 파일 유효성 검사 (비어있는지, 이미지 맞는지)
        String contentType = file.getContentType();
        if (file.isEmpty() || contentType == null || !contentType.startsWith("image")) {
            log.error("부적절한 파일 업로드 시도: {}", file.getOriginalFilename());
            throw new IllegalArgumentException("유효하지 않은 이미지 파일입니다.");
        }

        long startTime = System.currentTimeMillis();
        log.info("[Analyze] Start: userId={}, filename={}", principal.getUserId(), file.getOriginalFilename());

        SupplementAnalysisResponse response = analyzeService.analyzeSupplement(principal.getUserId(), file);

        long duration = System.currentTimeMillis() - startTime;
        log.info("[Analyze] End: duration={}ms", duration); // 성능 체크 필수다 친구야

        return ResponseUtil.ok(response);
    }
}
