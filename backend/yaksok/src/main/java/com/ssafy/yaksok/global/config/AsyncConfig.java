package com.ssafy.yaksok.global.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * 비동기 처리 설정
 *
 * LLM 호출과 같은 시간이 오래 걸리는 작업을 백그라운드에서 처리하기 위한 설정
 */
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig {

    /**
     * LLM 처리 + 영양제 병렬 분석 전용 ThreadPool
     *
     * - corePoolSize: 기본 스레드 수 (2개)
     * - maxPoolSize: 최대 스레드 수 (8개)
     *   → OcrAnalysisService에서 CompletableFuture 병렬 처리 시 최대 8개 영양제 동시 처리
     * - queueCapacity: 대기 큐 크기 (10개)
     * - threadNamePrefix: 스레드 이름 접두사
     *
     * 동작:
     * 1. 2개 스레드가 항상 대기
     * 2. 요청이 많으면 최대 8개까지 증가
     * 3. 8개 모두 사용 중이면 큐에 10개까지 대기
     * 4. 큐도 꽉 차면 CallerRunsPolicy로 메인 스레드에서 실행
     */
    @Bean(name = "llmTaskExecutor")
    public Executor llmTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

        // 기본 스레드 수
        executor.setCorePoolSize(2);

        // 최대 스레드 수: 영양제 병렬 처리 최대 8개 동시 실행 지원
        executor.setMaxPoolSize(8);

        // 대기 큐 크기
        executor.setQueueCapacity(10);

        // 스레드 이름 접두사
        executor.setThreadNamePrefix("LLM-Async-");

        // 거부 정책: 큐가 꽉 차면 호출한 스레드에서 직접 실행
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

        // 스레드 초기화
        executor.initialize();

        log.info("LLM 비동기 ThreadPool 초기화 완료: core={}, max={}, queue={}",
                executor.getCorePoolSize(),
                executor.getMaxPoolSize(),
                executor.getQueueCapacity());

        return executor;
    }

    /**
     * 일반 비동기 작업용 ThreadPool (필요시)
     */
    @Bean(name = "generalTaskExecutor")
    public Executor generalTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("Async-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();

        log.info("일반 비동기 ThreadPool 초기화 완료");

        return executor;
    }
}