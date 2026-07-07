# 약속 (Yak-Sok) — Backend

영양제 관리 서비스의 API·알림·데이터 백엔드입니다. 지능형 복약 알림(SSE/FCM 라우팅)과 AI 분석 결과 저장을 담당합니다.

- **전체 서비스 문서**: 상위 [../../README.md](../../README.md) · [아키텍처](../../docs/ARCHITECTURE.md) · [알림 시스템 리포트](../../notification_optimization_report.md)

## 이 백엔드의 핵심: 지능형 알림 라우팅

같은 알림을 SSE와 FCM으로 이중 발송하면 중복으로 울립니다. 사용자의 실시간 연결 상태를 보고 채널을 하나만 고릅니다.

```
스케줄러(매분) → 발송 대상 조회 → 사용자별 그룹화(Bundling)
  → 방해금지 시간대 체크
  → 라우팅: SSE 연결됨 → SSE로만 / 없음 → 활성 FCM 토큰으로 푸시
  → 발송 후 snooze 쿨다운(rescheduleAfterSend) — 매분 재발송 방지
```

핵심 로직: [notification/service/NotificationService.java](src/main/java/com/ssafy/yaksok/notification/service/NotificationService.java)

## 기술 스택

| 분류 | 기술 |
|---|---|
| Framework | Java 17 · Spring Boot 3.5.10 |
| Persistence | Spring Data JPA / Hibernate · MySQL |
| Auth | Spring Security · OAuth2(카카오) · JWT |
| Notification | SSE(Server-Sent Events) · Firebase FCM |
| AI 연동 | Groq(성분 정제 LLM) · FastAPI AI 서버 호출(서킷 브레이커 격리) |
| Build | Gradle |

> **성분 정제 LLM**: 초기 OpenAI에서 Groq(`groq/compound`, 실패 시 `qwen/qwen3.6-27b` 폴백)로 교체됨. 배경은 [트러블슈팅 #5](../../docs/TROUBLESHOOTING.md#5).
> **참고**: `spring-boot-starter-data-redis` 의존성이 선언되어 있으나 현재 런타임 로직에서는 사용하지 않습니다(알림 스케줄러 수평 확장 시 분산 락 용도로 도입 예정).

## 주요 도메인

- **notification** — 복약 알림, SSE/FCM 라우팅, 번들링, 방해금지 시간대
- **분석 연동** — FastAPI가 추출한 제품명으로 성분 DB 조회 → Groq LLM 성분 정제 → 저장
- **인증** — JWT + 카카오 OAuth2, `JwtAuthenticationFilter` 경로 예외 처리
- **안정성** — Resilience4j 서킷 브레이커로 외부 AI 서버 호출 격리, 전용 스레드풀 분리

## 실행

```bash
./gradlew bootRun
```

`.env`에 `GROQ_API_KEY`, FCM 서비스 계정, DB 접속 정보 등이 필요합니다.

## 참여

박종현 · 하윤철 · 김태희 · 박창희
