package com.ssafy.yaksok.user.controller;

import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.user.dto.UpdateUserRequest;
import com.ssafy.yaksok.user.dto.UserInfoResponse;
import com.ssafy.yaksok.user.dto.UsernameResponse;
import com.ssafy.yaksok.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 정보 관리 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * 사용자 이름 조회
     * GET /api/v1/user/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsernameResponse>> getUserName(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseUtil.ok(userService.getUserName(principal.getUserId()));
    }

    /**
     * 사용자 전체 정보 조회
     * GET /api/v1/user/info
     */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getUserInfo(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseUtil.ok(
                userService.getUserInfoResponse(principal.getUserId())
        );
    }

    /**
     * 사용자 프로필 수정
     * PUT /api/v1/user/edit
     */
    @PutMapping("/edit")
    public ResponseEntity<ApiResponse<Void>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody UpdateUserRequest request) {

        log.info("유저 정보 수정 요청: userId={}", principal.getUserId());
        userService.updateUserProfile(principal.getUserId(), request);
        return ResponseUtil.ok();
    }
}