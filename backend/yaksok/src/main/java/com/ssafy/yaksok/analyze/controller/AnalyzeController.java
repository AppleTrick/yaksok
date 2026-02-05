package com.ssafy.yaksok.analyze.controller;

import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.ssafy.yaksok.analyze.service.AnalyzeService;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

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

    /**
     * 영양제 이미지 분석 및 통합 리포트 생성
     * POST /api/v1/analyze
     * 
     * @param file 영양제 이미지 파일
     * @return 분석 결과 (DisplayData + ReportData)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SupplementAnalysisResponse>> analyzeSupplement(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) {
        Long userId = principal.getUserId();
        log.info("영양제 분석 API 호출 시작: User ID={}, File={}", userId, file.getOriginalFilename());
        long startTime = System.currentTimeMillis();

        SupplementAnalysisResponse response = analyzeService.analyzeSupplement(file, userId);

        long duration = System.currentTimeMillis() - startTime;
        log.info("영양제 분석 API 호출 완료: User ID={}, 소요 시간={}ms", userId, duration);

        return ResponseUtil.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Void>> analyzeTest(){
        return ResponseUtil.ok();
    }
}