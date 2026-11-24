package com.ssafy.yaksok.global.ratelimit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 사용자(또는 계정)별 요청 제한. 서버 한 대 안에서만 센다. 여러 대로 늘리면 Redis로 옮긴다. */
@Component
public class RateLimiter {

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public void check(String name, Object key, int capacity, Duration refill) {
        long now = System.nanoTime();
        long waitSeconds = buckets.computeIfAbsent(name + ":" + key, k -> new TokenBucket(capacity, refill, now)).tryTake(now);
        if (waitSeconds > 0) {
            throw new TooManyRequestsException(waitSeconds);
        }
    }

    @Scheduled(fixedDelay = 60_000)
    void dropIdle() {
        long now = System.nanoTime();
        buckets.values().removeIf(b -> b.isFull(now));
    }
}
