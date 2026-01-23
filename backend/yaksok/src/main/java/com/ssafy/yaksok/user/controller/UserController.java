package com.ssafy.yaksok.user.controller;

import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.user.dto.UsernameResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsernameResponse>> getUserName(
            @AuthenticationPrincipal UserPrincipal principal){
        return ResponseUtil.ok(new UsernameResponse(principal.getUsername()));
    }



}
