package com.ssafy.yaksok.global.ratelimit;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class TokenBucketTest {

    private static final long SECOND = 1_000_000_000L;

    @Test
    void allowsBurstThenRefills() {
        TokenBucket b = new TokenBucket(3, Duration.ofSeconds(10), 0);
        for (int i = 0; i < 3; i++) assertThat(b.tryTake(0)).isZero();
        assertThat(b.tryTake(0)).isEqualTo(10);
        assertThat(b.tryTake(4 * SECOND)).isEqualTo(6);
        assertThat(b.tryTake(10 * SECOND)).isZero();
        assertThat(b.tryTake(10 * SECOND)).isPositive();
    }

    @Test
    void neverHoldsMoreThanCapacity() {
        TokenBucket b = new TokenBucket(2, Duration.ofSeconds(1), 0);
        long later = 1000 * SECOND;
        assertThat(b.isFull(later)).isTrue();
        assertThat(b.tryTake(later)).isZero();
        assertThat(b.tryTake(later)).isZero();
        assertThat(b.tryTake(later)).isPositive();
    }
}
