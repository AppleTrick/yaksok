package com.ssafy.yaksok.user.controller;

import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import com.ssafy.yaksok.security.principal.UserPrincipal;
import com.ssafy.yaksok.user.dto.UsernameResponse;
import com.ssafy.yaksok.user.service.UserService;
import lombok.RequiredArgsConstructor;
<<<<<<< HEAD
import lombok.extern.slf4j.Slf4j;
=======
>>>>>>> origin/develop
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

<<<<<<< HEAD
@Slf4j
=======
>>>>>>> origin/develop
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UsernameResponse>> getUserName(
            @AuthenticationPrincipal UserPrincipal principal){
<<<<<<< HEAD

        log.info(userService.getUserName(principal.getUserId()).toString());
=======
>>>>>>> origin/develop
        return ResponseUtil.ok(userService.getUserName(principal.getUserId()));
    }



}
