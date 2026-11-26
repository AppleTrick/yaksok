package com.ssafy.yaksok.global.ratelimit;

import java.time.Duration;

/** 토큰 버킷. capacity만큼 몰아 쓸 수 있고 refill마다 하나씩 다시 찬다. */
class TokenBucket {

    private final int capacity;
    private final long refillNanos;
    private double tokens;
    private long last;

    TokenBucket(int capacity, Duration refill, long now) {
        this.capacity = capacity;
        this.refillNanos = refill.toNanos();
        this.tokens = capacity;
        this.last = now;
    }

    /** @return 0이면 통과, 아니면 다시 시도할 때까지 남은 초 */
    synchronized long tryTake(long now) {
        tokens = Math.min(capacity, tokens + (double) (now - last) / refillNanos);
        last = now;
        if (tokens >= 1) {
            tokens -= 1;
            return 0;
        }
        return Math.max(1, (long) Math.ceil((1 - tokens) * refillNanos / 1_000_000_000.0));
    }

    /** 가득 찬 버킷은 새로 만든 것과 같으므로 버려도 된다 */
    synchronized boolean isFull(long now) {
        return tokens + (double) (now - last) / refillNanos >= capacity;
    }
}
