package com.ssafy.yaksok.global.ratelimit;

import lombok.Getter;

@Getter
public class TooManyRequestsException extends RuntimeException {

    private final long retryAfterSeconds;

    public TooManyRequestsException(long retryAfterSeconds) {
        super("요청이 너무 많습니다");
        this.retryAfterSeconds = retryAfterSeconds;
    }
}
