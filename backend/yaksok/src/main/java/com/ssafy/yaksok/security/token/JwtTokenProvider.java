package com.ssafy.yaksok.security.token;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Slf4j
@Component
public class JwtTokenProvider {

    private static final long ACCESS_TOKEN_EXPIRE_TIME = 1000L * 60 * 30; //30분
    private static final long REFRESH_TOKEN_EXPIRE_TIME = 1000L * 60 * 60 * 24; //24시간

    private final Key key;
    private final UserDetailsService userDetailsService;

    public JwtTokenProvider(UserDetailsService userDetailsService, @Value("${jwt.secret}") String secret
    ) {
        this.userDetailsService = userDetailsService;
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    //지금 유저 ID를 이용해서 토큰들을 생성함. 다른 정보를 바탕으로 만들어서 활용가능하니까 확인하기.

    public String createAccessToken(long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + ACCESS_TOKEN_EXPIRE_TIME);
        return Jwts.builder()
                .setSubject(Long.toString(userId))
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + REFRESH_TOKEN_EXPIRE_TIME);

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }



    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key)   // 서명 검증용 키
                    .build()
                    .parseClaimsJws(token); // 검증 수행

            return true;
        } catch (SecurityException | MalformedJwtException e) {
            // 서명 불일치, JWT 형식 깨짐
            log.warn("Invalid JWT signature or malformed token");
        } catch (ExpiredJwtException e) {
            // 만료된 토큰
            log.warn("Expired JWT token");
        } catch (UnsupportedJwtException e) {
            // 지원하지 않는 JWT
            log.warn("Unsupported JWT token");
        } catch (IllegalArgumentException e) {
            // null, empty
            log.warn("JWT token is null or empty");
        }
        return false;
    }

    public Authentication getAuthentication(String token) {
        String userId = getUserId(token);

        UserDetails userDetails =
                userDetailsService.loadUserByUsername(userId);

        return new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                userDetails.getAuthorities()
        );
    }

    public String getUserId(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }
}

