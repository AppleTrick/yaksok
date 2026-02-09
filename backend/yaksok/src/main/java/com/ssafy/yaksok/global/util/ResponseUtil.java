    package com.ssafy.yaksok.global.util;

    import com.ssafy.yaksok.global.dto.ApiResponse;
    import com.ssafy.yaksok.global.dto.ErrorResponse;
    import com.ssafy.yaksok.global.exception.ErrorCode;
    import org.springframework.http.HttpHeaders;
    import org.springframework.http.ResponseCookie;
    import org.springframework.http.ResponseEntity;

    public class ResponseUtil {

        private ResponseUtil() {}

        public static <T> ResponseEntity<ApiResponse<T>> ok(T data) {
            return ResponseEntity.ok(ApiResponse.success(data));
        }

        public static ResponseEntity<ApiResponse<Void>> ok() {
            return ResponseEntity.ok(ApiResponse.success());
        }

        public static ResponseEntity<ApiResponse<Void>> okWithCookies(
                ResponseCookie... cookies
        ) {
            HttpHeaders headers = new HttpHeaders();
            for (ResponseCookie cookie : cookies) {
                headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
            }

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(ApiResponse.success());
        }

        public static <T> ResponseEntity<ApiResponse<T>> okWithCookies(
                T data,
                ResponseCookie... cookies
        ) {
            HttpHeaders headers = new HttpHeaders();
            for (ResponseCookie cookie : cookies) {
                headers.add(HttpHeaders.SET_COOKIE, cookie.toString());
            }

            return ResponseEntity
                    .ok()
                    .headers(headers)
                    .body(ApiResponse.success(data));
        }

        //에러 관리

        public static ResponseEntity<ErrorResponse> error(ErrorCode errorCode) {
            return ResponseEntity
                    .status(errorCode.getStatus())
                    .body(ErrorResponse.of(errorCode));
        }
    }
