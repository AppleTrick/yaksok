# 약속 (Yak-Sok)

> 영양제 병을 카메라로 비추면 인식·분석하고, 접속 상태에 맞춰 알림 방식을 바꿔주는 영양제 관리 서비스

🔗 **직접 써보기**: [https://yaksok.changhee.dev](https://yaksok.changhee.dev)

<!-- TODO: 카메라 인식 / 알림 / 분석 리포트 화면 스크린샷 2~3장 -->

## 어떤 문제를 풀었나요?

### 1. "이거 무슨 영양제였지?"를 카메라로

영양제 병을 촬영하면 YOLOv11m가 병을 탐지하고, OCR이 라벨의 성분을 읽어 분석합니다. 이 과정에서 가장 어려웠던 것은 **"영양제가 아닌 것을 영양제로 착각하는 오탐지"** 였습니다. 텀블러, 컵처럼 비슷하게 생긴 물체가 문제였죠.

데이터 파이프라인을 V1 → V3로 개선하며 이 문제를 다뤘습니다:

| 버전 | 데이터 | mAP@50 | Precision | 핵심 변화 |
|---|---|---|---|---|
| V1 (Baseline) | 520장 | - | - | 공개 데이터셋 기반 초기 학습 |
| V2 (Augmented) | 1,250장 | - | - | 조명/각도 증강 → 컵·텀블러 오탐지 발생 |
| V3 (Final) | 2,480장 | **0.814** | **0.921** | Hard Negative Mining + 라벨 검수 |

V2에서 생긴 False Positive를 잡기 위해, **영양제가 없는 배경 이미지(COCO 등)를 학습에 포함(Negative Sampling)** 하고 `review_labels.py` 검수 도구로 라벨을 정제했습니다. 상세는 [데이터 파이프라인 리포트](./DataPipeLine/PROJECT_REPORT.md) 참고.

### 2. "알림이 두 번 울린다" — 접속 상태에 맞춘 지능형 라우팅

앱을 보고 있는데 시스템 푸시까지 오면 알림이 중복됩니다. 약속은 사용자의 실시간 연결 상태에 따라 채널을 자동 전환합니다:

```
알림 발송 시점
  ├─ SSE 연결됨(앱 접속 중)  → SSE로만 발송, FCM 푸시 생략 → 인앱 토스트
  └─ SSE 연결 없음(백그라운드) → FCM 푸시로 확실히 전달
프론트: 화면 활성(Visible)이면 토스트만, 숨김(Hidden)이면 시스템 알림
```

여기에 **묶음 발송(Bundling)** 을 더했습니다. 같은 시간에 먹어야 할 영양제 3개를 각각 울리는 대신 "비타민C 외 2건 섭취 시간입니다"로 통합합니다. 상세는 [알림 시스템 리포트](./notification_optimization_report.md) 참고.

## OCR 파이프라인을 관리형 API로 전환한 기록

초기 파이프라인은 `YOLO11 → PaddleOCR(자체 호스팅)` 구조였습니다. 곡면 병에 인쇄된 작은 글씨·장식 폰트 때문에 정확도가 낮았고, CPU에서 멀티모델 체인(문서 방향 → 곡면 보정 → 라인 방향 → 검출 → 인식)을 매 요청마다 돌아 느렸습니다.

Google Vision API로 전환하는 과정에서 **PaddleOCR을 계속 썼다면 배포 시 서버가 통째로 죽었을** 버전 호환성 문제까지 추적해 문서화했습니다 (`paddleocr>=2.9.0` 하한 핀 드리프트 → PIR 포맷 불일치 → ARM 환경 추론 시 세그폴트). → [OCR 파이프라인 기술 리포트](./docs/report/OCR_PIPELINE_TECHNICAL_REPORT.md)

## 핵심 기능

- **AI 영양제 인식** — YOLOv11m 객체 탐지 + Google Vision OCR + Gemini 제품명 정제 (`/ai/v1/analyze2` 경로)
- **지능형 알림** — SSE/FCM 자동 라우팅 + 가시성 필터링 + 묶음 발송, 방해금지 시간대 지원
- **분석 리포트** — 일일 섭취량 vs 상한 섭취량 비교, 과다 섭취 경고, Recharts 시각화
- **PWA** — 앱 수준 사용자 경험, 다크/라이트 모드

## 기술 스택

| 영역 | 기술 |
|---|---|
| Frontend | Next.js 16 (React 19, TS) · Tailwind CSS · Framer Motion · PWA · Recharts · Firebase FCM |
| Backend | Spring Boot (Java) · JPA/Hibernate · SSE · FCM 토큰 관리 · MySQL |
| AI Server | FastAPI (Python) · YOLOv11m (PyTorch/Ultralytics) · Google Vision API · Gemini |
| Data Pipeline | Ultralytics YOLO · Albumentations · OpenCV · 커스텀 라벨링/검수 도구 |
| Infra | Docker · Jenkins · Traefik · Groq(백엔드 성분 정제 LLM) |

## 주요 기술적 의사결정

**자체 OCR 대신 관리형 API** — 영양제 라벨 OCR은 범용 모델의 한계가 뚜렷하고, 자체 호스팅은 CPU 멀티모델 체인으로 느렸습니다. 연산 비용을 Google 인프라로 넘겨 정확도·속도를 동시에 확보했습니다. 파인튜닝(근본 해결)과 관리형 API의 트레이드오프를 저울질한 결과입니다.

**SSE + FCM 하이브리드 알림** — 실시간성이 필요한 접속 중 사용자는 SSE로 즉시, 백그라운드 사용자는 FCM으로 확실하게. 하나의 채널만으로는 "즉시성"과 "도달성"을 동시에 만족할 수 없어 상태 기반으로 분기했습니다.

**Negative Sampling으로 오탐지 제어** — 데이터를 늘리는 것(V2)만으로는 유사 물체 오탐지가 오히려 늘었습니다. "영양제가 없는 이미지"를 학습에 넣어 모델에게 "이건 영양제가 아니다"를 가르쳤습니다.

## 문서

| 문서 | 내용 |
|---|---|
| [시스템 아키텍처](./docs/ARCHITECTURE.md) | 4-tier 구성도, AI 분석/알림 요청 흐름, 배포 |
| [OCR 파이프라인 기술 리포트](./docs/report/OCR_PIPELINE_TECHNICAL_REPORT.md) | PaddleOCR → Vision API 전환 + 호환성 세그폴트 분석 |
| [데이터 파이프라인 리포트](./DataPipeLine/PROJECT_REPORT.md) | YOLO 모델 V1→V3 개선 성과 |
| [알림 시스템 리포트](./notification_optimization_report.md) | 지능형 라우팅·번들링 개선 |
| [트러블슈팅 사례집](./docs/TROUBLESHOOTING.md) | 버그별 증상 → 추적 → 원인 → 수정 기록 |
| [개발 여정](./docs/DEVELOPMENT_HISTORY.md) | 커밋 로그로 재구성한 의사결정의 흐름 |
| [작업 히스토리](./docs/history/) | 날짜별 작업 기록 |

## 시작하기

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend/yaksok && ./gradlew bootRun

# AI Server
cd fastapi && pip install -r requirements.txt && uvicorn app.main:app --reload
```

## 팀

팀장 박창희 · 팀원 하윤철, 박종현, 이유정, 허승, 김태희
