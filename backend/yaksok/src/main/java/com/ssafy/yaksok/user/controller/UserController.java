package com.ssafy.yaksok.user.controller;

import com.ssafy.yaksok.disease.service.DiseaseService;
import com.ssafy.yaksok.disease.service.UserDiseaseService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.user.dto.UserDataResponse;
import com.ssafy.yaksok.user.dto.UserInfoResponse;
import com.ssafy.yaksok.user.dto.UsernameResponse;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsernameResponse>> getUserName(
            @AuthenticationPrincipal UserPrincipal principal){
        return ResponseUtil.ok(userService.getUserName(principal.getUserId()));
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<UserInfoResponse>> getUserInfo(
            @AuthenticationPrincipal UserPrincipal principal){

        return ResponseUtil.ok(
                userService.getUserInfoRespone(principal.getUserId())
        );
    }
}
