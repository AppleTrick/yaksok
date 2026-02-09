package com.ssafy.yaksok.security.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ssafy.yaksok.global.dto.ErrorResponse;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.global.util.CookieUtil;
import com.ssafy.yaksok.security.token.JwtTokenProvider;
import com.ssafy.yaksok.security.token.JwtTokenResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenResolver jwtTokenResolver;
    private final JwtTokenProvider jwtTokenProvider;
    private final CookieUtil cookieUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            String path = request.getRequestURI();
            String token = jwtTokenResolver.resolve(request);

            if (token != null && jwtTokenProvider.validateToken(token)) {
                Authentication authentication = jwtTokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("JWT 필터: 인증 성공 - path: {}, userId: {}", path, authentication.getName());
            } else {
                if (path.startsWith("/api/v1/notification")) {
                    log.debug("JWT 필터: 인증 실패 또는 토큰 없음 - path: {}, token exists: {}", path, (token != null));
                }
            }

            filterChain.doFilter(request, response);

        } catch (BusinessException e) {
            ErrorCode errorCode = e.getErrorCode();

            ErrorResponse errorResponse = ErrorResponse.of(errorCode);

            response.setStatus(errorCode.getStatus().value());
            response.setContentType("application/json;charset=UTF-8");

            response.addHeader(
                    "Set-Cookie",
                    cookieUtil.deleteAccessToken().toString());

            new ObjectMapper().writeValue(
                    response.getWriter(),
                    errorResponse);
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        return path.startsWith("/api/v1/auth")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs");
    }

}
