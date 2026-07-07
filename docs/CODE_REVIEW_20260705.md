# 코드 리뷰 및 수정 계획 (2026-07-05)

> 문서 주장과 실제 코드를 대조한 리뷰 결과. 내부 작업용 문서 — 포트폴리오 README에는 링크하지 않음.
> 심각도순 정렬. 체크박스는 수정 완료 시 체크.

## 요약

| 심각도 | 건수 | 내용 |
|---|---|---|
| 🔴 High | 3 | `createNotificationSetting` 저장 누락, 트랜잭션 없는 엔티티 수정 2건 |
| 🟡 Medium | 3 | README/문서 수치 과장, 레거시 OCR 경로 위험 방치, .dockerignore 부재 |
| 🟢 Low | 2 | 미사용 메서드, FCM 실패 시 토큰 정리 없음 |

---

## 🔴 1. `createNotificationSetting`이 만든 엔티티를 저장하지 않음

- [ ] 수정

**위치**: `backend/yaksok/.../notification/service/NotificationService.java:320`

**문제**: 메서드가 `NotificationSetting.create(...)`로 엔티티를 만들기만 하고 `notificationSettingRepository.save()`를 호출하지 않는다. 게다가 `@Transactional`도 없어 영속화 경로가 전혀 없다 → **방해금지 시간 설정이 DB에 저장되지 않는다.** 조용히 실패(에러 없음).

```java
public void createNotificationSetting(long userId, NotificationSettingRequest request) {
    NotificationSetting notificationSetting = NotificationSetting.create(...);
    // ← save() 없음. 여기서 끝. 로컬 변수만 만들고 버려짐
}
```

**수정**: `notificationSettingRepository.save(notificationSetting);` 추가. 반환 타입도 저장된 엔티티/DTO로 바꾸는 것을 검토.

**검증**: 방해금지 설정 생성 후 DB 조회 → 레코드 존재 확인.

---

## 🔴 2. `@Transactional` 없이 엔티티를 수정 — 변경이 반영 안 될 수 있음

- [ ] 수정

**위치**: `NotificationService.java:40` (`enableToggleNotification`), `:111` (`editNotificationSetting`)

**문제**: 두 메서드 모두 조회한 엔티티의 상태를 바꾸는데(`enable()`/`disable()`, `changeQuietTime()`) `@Transactional`이 없다. JPA dirty checking은 트랜잭션 안에서만 동작하므로, 영속성 컨텍스트가 메서드 종료 시 flush되지 않으면 **변경이 DB에 반영되지 않거나 환경(OSIV 설정)에 따라 동작이 갈린다.** 같은 클래스의 `takenToggleNotification`, `snoozeNotification` 등 다른 수정 메서드에는 `@Transactional`이 붙어 있어 일관성도 깨져 있다.

**대조**: 알림 토글이 "됐다 안 됐다" 하는 버그로 나타날 수 있고, OSIV(Open Session In View)가 켜져 우연히 동작 중일 수 있으나 이는 설정에 기댄 우연이다.

**수정**: 두 메서드에 `@Transactional` 추가. 클래스 전체의 조회/수정 메서드 트랜잭션 경계를 한 번 점검 (조회는 `readOnly=true` 권장).

**검증**: OSIV 끈 상태에서 토글 → 반영 확인.

---

## 🟡 3. README/문서 수치가 실제 결과보다 과장됨

- [ ] 문서 수정 (본 README에서 일부 정정 완료)

**위치**: 루트 `README.md` 초안 vs `DataPipeLine/PROJECT_REPORT.md`

**문제**: README 초안이 "mAP@50 **0.90 이상** 달성", "라벨링 정확도 **99%**"라고 썼는데, 실제 최종 리포트(PROJECT_REPORT.md)의 V3 결과는 **mAP@50 0.814, Precision 0.921, Recall 0.730**이다. 면접관이 리포트를 열면 수치가 안 맞는다 — ijip의 자소서 검증 사례와 같은 위험.

**수정**: 본 README는 실제 수치(0.814/0.921)로 정정함. "라벨링 정확도 99%"도 리포트에 근거가 명확치 않으므로, "review_labels.py 검수 도구로 라벨 정제" 정도로 표현을 낮추는 것을 권장. 또한 초안의 오타(`Alert Next.js 16`, `MySQL/MariaDB (추정)`)도 정정 대상.

---

## 🟡 4. 레거시 OCR 경로가 위험한 채로 방치됨

- [ ] 결정 필요

**위치**: `fastapi/app/api/endpoints.py` `/ai/v1/analyze` (YOLO + PaddleOCR)

**문제**: [OCR 리포트](./report/OCR_PIPELINE_TECHNICAL_REPORT.md)에서 확인된 대로, 이 경로는 ARM 환경에서 PaddleOCR 추론 시 **서버 프로세스 전체를 죽이는 세그폴트** 위험이 있다. 현재는 버전 핀 미적용으로 OCR이 빈 값만 반환하는 "안전한 무력화" 상태지만, 죽은 코드가 엔드포인트로 열려 있다.

**수정 방법** (택1):
1. 경로 제거 또는 명시적 비활성화(501 반환) — 가장 안전
2. ONNX export + onnxruntime로 재구현 (PIR/네이티브 빌드 이슈 회피)
3. 별도 컨테이너로 격리해 죽어도 Vision 경로에 영향 없게

**권장**: 포트폴리오 관점에서는 1번(제거)이 깔끔하고, 리포트에 "왜 제거했는가"가 이미 문서화되어 있어 서사가 완결됨.

---

## 🟡 5. `.dockerignore` 부재

- [ ] 수정

**위치**: `fastapi/`

**문제**: [history 6/17](./history/20260617.md) 기록대로 `venv/` 폴더가 빌드 컨텍스트에 포함돼 6.56GB로 비대해졌다. 임시로 폴더를 지웠지만 `.dockerignore`가 없으면 재발한다.

**수정**: `fastapi/.dockerignore`에 `venv/`, `__pycache__/`, `*.pyc`, `Sample_Image/`, `SaveImage/`, `.env` 등 추가. backend/frontend도 점검.

---

## 🟢 6. 미사용/불명확 메서드

**위치**: `NotificationService.java`
- `sendByPlatform(...)` (line ~289) — 정의돼 있으나 호출부가 없어 보임. 확인 후 제거
- `intake()`와 `takenToggleNotification()`의 역할 중복 여부 점검

## 🟢 7. FCM 발송 실패 시 무효 토큰 정리 없음

**위치**: `FcmSender.java` `addCallback`
- 발송 실패(만료/무효 토큰)를 로그만 남기고 토큰을 비활성화하지 않으면, 죽은 토큰으로 매번 발송 시도가 누적된다. 실패 콜백에서 `UNREGISTERED`/`INVALID_ARGUMENT` 시 토큰 `isActive=false` 처리 권장.

---

## 잘 만들어진 부분 (수정 불필요 — 면접 어필 재료)

- **SSE/FCM 상태 기반 라우팅** — 즉시성과 도달성을 상태로 분기한 설계. 핵심 어필 포인트
- **rescheduleAfterSend** — 무한 재발송 방지 쿨다운, 주석에 이유까지 명시
- **isBetween의 자정 넘김 처리** — 방해금지 시간대(22:00~07:00) 경계 케이스를 정확히 다룸
- **Resilience4j 서킷 브레이커** — 외부 AI 서버 실패를 시스템 경계로 격리
- **OCR 전환 리포트의 깊이** — 로드 성공 후 추론 세그폴트까지 끝까지 추적한 것은 드문 수준의 검증

## 권장 작업 순서 (내일)

1. **#1 저장 누락** (5분, 기능 버그)
2. **#2 @Transactional** (10분, 데이터 정합성)
3. **#3 README 수치 정정** (일부 완료, 나머지 10분)
4. **#4 레거시 OCR 경로 제거** (30분) + **#5 .dockerignore** (10분)
5. #6, #7은 여유 시
