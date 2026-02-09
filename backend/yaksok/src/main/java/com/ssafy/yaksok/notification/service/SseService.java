package com.ssafy.yaksok.notification.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SseService {

    private static final Long DEFAULT_TIMEOUT = 60L * 1000 * 60; // 1시간
    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        // 기존 연결이 있으면 제거 (새로운 연결로 대체)
        if (emitters.containsKey(userId)) {
            log.info("기존 SSE 연결 교체: userId={}", userId);
            SseEmitter oldEmitter = emitters.get(userId);
            try {
                oldEmitter.complete();
            } catch (Exception e) {
                log.warn("기존 SSE 연결 종료 중 오류 발생: {}", e.getMessage());
            }
            emitters.remove(userId);
        }

        SseEmitter emitter = new SseEmitter(DEFAULT_TIMEOUT);
        int emitterHash = emitter.hashCode();
        emitters.put(userId, emitter);
        log.info("새 SSE 에미터 등록: userId={}, hash={}", userId, emitterHash);

        emitter.onCompletion(() -> {
            log.info("SSE 연결 완료(Completion): userId={}, hash={}", userId, emitterHash);
            emitters.remove(userId, emitter);
        });
        emitter.onTimeout(() -> {
            log.info("SSE 연결 타임아웃: userId={}, hash={}", userId, emitterHash);
            emitter.complete();
            emitters.remove(userId, emitter);
        });
        emitter.onError((e) -> {
            log.error("SSE 연결 에러: userId={}, hash={}, message={}", userId, emitterHash, e.getMessage());
            emitter.complete();
            emitters.remove(userId, emitter);
        });

        // 더미 데이터 전송 (연결 초기화 및 프록시 버퍼링 방지)
        try {
            // 주석(: )으로 2KB 패딩을 보냄 (Jackson을 거치지 않고 스트림에 직접 기록)
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("connected!"));

            // 프록시 버퍼링 방지용 4KB 주석 패딩
            emitter.send(SseEmitter.event().comment(" ".repeat(4096)));

            log.info("SSE 초기 연결 메세지 및 4KB 패딩 전송 성공: userId={}, hash={}", userId, emitterHash);
        } catch (Exception e) {
            log.warn("SSE 초기 연결 메세지 전송 실패: userId={}, hash={}, error={}", userId, emitterHash, e.getMessage());
        }

        return emitter;
    }

    public void sendNotification(Long userId, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            int emitterHash = emitter.hashCode();
            try {
                emitter.send(SseEmitter.event()
                        .data(data));
                log.info("SSE 알림 전송 완료: userId={}, hash={}", userId, emitterHash);
            } catch (IOException e) {
                log.error("SSE 알림 전송 실패: userId={}, hash={}, error={}", userId, emitterHash, e.getMessage());
                emitters.remove(userId, emitter);
            }
        } else {
            log.warn("SSE 알림 전송 스킵: 연결된 클라이언트 없음 - userId={}", userId);
            log.debug("현재 연결된 사용자들: {}", emitters.keySet());
        }
    }

    /**
     * 연결 유지를 위한 하트비트 (15초마다 더미 전송 - 버퍼링 방지 강화를 위해 단축)
     */
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 15000)
    public void sendHeartbeat() {
        if (emitters.isEmpty())
            return;

        log.debug("SSE 하트비트 전송 시작 (대상: {}명)", emitters.size());
        emitters.forEach((userId, emitter) -> {
            int emitterHash = emitter.hashCode();
            try {
                emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("ping"));
                log.debug("SSE 하트비트 전송 성공: userId={}, hash={}", userId, emitterHash);
            } catch (IOException e) {
                log.debug("SSE 하트비트 전송 실패 (정상 종료로 간주): userId={}, hash={}", userId, emitterHash);
                emitters.remove(userId, emitter);
            }
        });
    }

    public boolean isUserConnected(Long userId) {
        return emitters.containsKey(userId);
    }
}
