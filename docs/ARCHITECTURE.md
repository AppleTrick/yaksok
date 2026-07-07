# 시스템 아키텍처

약속(Yak-Sok)의 4-tier 구성, AI 분석·알림 요청 흐름, 배포 파이프라인 정리. AI 관련 상세는 [OCR 파이프라인 리포트](./report/OCR_PIPELINE_TECHNICAL_REPORT.md)와 [데이터 파이프라인 리포트](../DataPipeLine/PROJECT_REPORT.md), 알림은 [알림 시스템 리포트](../notification_optimization_report.md) 참고.

## 전체 구성도

```
사용자 (PWA / 브라우저)
        │ HTTPS
        ▼
┌─────────────────────────┐
│ Traefik (리버스 프록시, TLS)  │
└──────────┬──────────────┘
     ┌─────┼───────────────┐
     ▼     ▼               ▼
yaksok-front  yaksok-back ──────────┐   yaksok-fastapi
Next.js(PWA)  Spring Boot           │   FastAPI (AI 서버)
              │        │            │        │
     ┌────────┘        │            │        ▼
     ▼                 ▼            ▼   ┌──────────────┐
  MySQL           Firebase FCM    Groq │ YOLOv11m      │
 (사용자/영양제/    (푸시 알림)     (성분  │ Google Vision │
  알림/로그)                       정제)  │ Gemini        │
                                        └──────────────┘
        ▲
        │ SSE (실시간 알림, 앱 접속 중)
  yaksok-front
```

- **알림은 두 채널**: 접속 중(SSE)이면 백엔드가 SSE로, 백그라운드면 Firebase FCM으로 발송
- **AI 분석은 별도 FastAPI 서버**: 백엔드가 이미지를 FastAPI로 넘기고, FastAPI가 YOLO→Vision→Gemini 체인을 실행
- **LLM 두 군데**: 백엔드는 성분 정제에 Groq, FastAPI는 제품명 정제에 Gemini (둘 다 외부 API)

## 저장소 구조 (모노레포)

```
yaksok/
├── backend/yaksok/       # Spring Boot (Java) — API, 알림, DB
│   └── src/main/java/com/ssafy/yaksok/
│       ├── notification/ # 알림 도메인 (SSE/FCM 라우팅, 번들링)
│       ├── ...           # 사용자, 영양제, 분석 등
│       └── global/       # 공통 설정·예외·보안
├── frontend/             # Next.js 16 (PWA)
├── fastapi/              # AI 서버 (Python)
│   └── app/
│       ├── main.py       # FastAPI 엔트리
│       ├── api/          # 엔드포인트 (/ai/v1/analyze, /analyze2)
│       └── services/     # yolo / vision / ocr / llm / analysis 서비스
├── DataPipeLine/         # YOLO 학습 데이터 구축·파이프라인 (오프라인)
│   └── Main_Pipeline/    # 전처리·라벨링·학습 스크립트
└── docs/
```

## 핵심 요청 흐름

### 1. 영양제 분석 (권장 경로: /ai/v1/analyze2)

```
카메라 촬영 → 백엔드 → FastAPI POST /ai/v1/analyze2
  ▼
[1] YOLOv11m — 이미지에서 영양제 병 탐지 (bounding box)
  ▼
[2] Google Vision Object Localization + 개별 OCR — 라벨 텍스트 추출
  ▼
[3] Gemini — OCR 원문에서 제품명 정제 (예: "센트룸 멀티 구미")
  ▼
백엔드 — 제품명으로 성분 DB 조회 → 성분 정제(Groq LLM) → 저장
  ▼
분석 리포트 (일일 섭취량 vs 상한, 과다 경고, Recharts)

※ 레거시 경로 /ai/v1/analyze (YOLO + 자체 PaddleOCR)는 OCR 실패 시 빈 값 반환하는
   안전 상태로 유지. ARM 세그폴트 이슈로 PaddleOCR 버전 핀은 미적용
   (→ OCR_PIPELINE_TECHNICAL_REPORT.md)
```

### 2. 지능형 알림 (스케줄러 → 라우팅)

```
스케줄러 (매분) → processNotifications() [@Async]
  ▼
발송 대상 조회 (enabled=true, intaken=false, 시각 도래)
  ▼
사용자별 그룹화 (Bundling — 같은 시간 여러 영양제를 하나로)
  ▼
방해금지 시간대(quietTime) 체크 → 해당 시 스킵
  ▼
채널 라우팅:
  ├─ SSE 연결됨   → SSE로만 발송 (FCM 생략)
  └─ SSE 없음     → 활성 FCM 토큰 전체로 푸시
  ▼
rescheduleAfterSend() — 발송 후 snooze로 쿨다운 (매분 재발송 방지)

프론트: 화면 Visible → 인앱 토스트만 / Hidden → 시스템 알림
        + 동일 알림 ID 10초 중복 차단
```

### 3. 인증

```
카카오 소셜 로그인 → JWT 발급 → JwtAuthenticationFilter로 요청 인증
프론트 라우팅 가드로 보호 경로 접근 제어
```

## 데이터 파이프라인 (오프라인, DataPipeLine/)

서비스 런타임과 분리된 YOLO 모델 학습 과정:

```
공개 데이터셋 수집 → YOLO-World 자동 라벨링 → review_labels.py 수동 검수
  → Albumentations 증강 → Negative Sampling(배경 이미지 추가) → YOLOv11m 학습
  → 최종 모델(.pt)을 fastapi/model/로 배포
```

## 배포 파이프라인

```
GitHub (master)
  ▼
Jenkins: git pull → docker compose build/up (yaksok-back / yaksok-front / yaksok-fastapi)
  ▼
Traefik 라우팅 (yaksok.changhee.dev)
```

운영 호스트는 **linux/arm64** (docker ps로 확인됨). 이 아키텍처가 PaddleOCR 추론 세그폴트의 근본 원인이라 레거시 OCR 경로를 비활성 상태로 둔 배경이 됨.

## 현재 한계와 확장 경로

| 한계 | 원인 | 확장 시 전환 경로 |
|---|---|---|
| 레거시 PaddleOCR 경로 위험 | ARM 추론 세그폴트 | ONNX export + onnxruntime, 또는 경로 제거 |
| AI 분석이 외부 API 의존 | Vision/Gemini 호출 비용·지연 | 영양제 라벨 crop 데이터로 OCR 파인튜닝 |
| 알림 스케줄러 단일 인스턴스 | 매분 배치 | 수평 확장 시 분산 락 / 메시지 큐 |
| SSE 연결 상태 단일 서버 관리 | 인메모리 연결 맵 | 다중 서버 시 Redis 등 공유 상태 |
