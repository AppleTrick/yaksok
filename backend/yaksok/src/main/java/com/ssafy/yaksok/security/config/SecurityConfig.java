package com.ssafy.yaksok.security.config;

import com.ssafy.yaksok.security.contants.SecurityUrls;
import com.ssafy.yaksok.security.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthenticationFilter;

        @Bean
        public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

                http
                                // ORS 활성화
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // 1. 기본 보안 기능 OFF
                                .csrf(AbstractHttpConfigurer::disable)
                                .formLogin(AbstractHttpConfigurer::disable)
                                .httpBasic(AbstractHttpConfigurer::disable)

                                // 2. 세션 미사용 (JWT)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // 3. 인가 정책
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(SecurityUrls.PUBLIC).permitAll()
                                                .requestMatchers("/api/v1/notification/subscribe").permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**")
                                                .permitAll()
                                                .anyRequest().authenticated())

                                // 4. JWT 필터 등록
                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        // Actuator는 관리 포트(8081)에만 열리고 Traefik이 라우팅하지 않아 외부 비공개 → 인증 필터에서 제외 (Prometheus 수집용)
        @Bean
        public WebSecurityCustomizer actuatorSecurityCustomizer() {
                return web -> web.ignoring().requestMatchers("/actuator/**");
        }

        // CORS 설정 Bean
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();

                config.setAllowedOrigins(List.of(
                                "http://localhost:3000",
                                "https://yaksok.changhee.dev"));
                config.setAllowedMethods(List.of(
                                "GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));

                config.setAllowCredentials(true); // 쿠키 허용 (중요)

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);

                return source;
        }
}
