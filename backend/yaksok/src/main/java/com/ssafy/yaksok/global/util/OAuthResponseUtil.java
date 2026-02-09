package com.ssafy.yaksok.global.util;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;

public class OAuthResponseUtil {

    private OAuthResponseUtil() {}

    public static ResponseEntity<Void> redirectWithCookies(
            String location,
            ResponseCookie... cookies
    ) {
        HttpHeaders headers = new HttpHeaders();
        for (ResponseCookie cookie : cookies) {
            headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
        }
        headers.add(HttpHeaders.LOCATION, location);

        return ResponseEntity
                .status(302)
                .headers(headers)
                .build();
    }
}

