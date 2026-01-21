package com.ssafy.yaksok.security.filter;

import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenResolver jwtTokenResolver;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // 요청에서 JWT 추출 (쿠키)
        String token = jwtTokenResolver.resolve(request);

        // 토큰이 있고, 유효하면 인증 처리
        if (token != null && jwtTokenProvider.validateToken(token)) {

            Authentication authentication =
                    jwtTokenProvider.getAuthentication(token);

            // SecurityContext에 인증 정보 저장
            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);
        }

        // 다음 필터로 이동
        filterChain.doFilter(request, response);
    }
}
