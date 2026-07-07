# 약속 (Yak-Sok) — Frontend

영양제 병 촬영·인식부터 지능형 복약 알림까지 제공하는 PWA 프론트엔드입니다.

- **전체 서비스 문서**: 상위 [../README.md](../README.md) · [아키텍처](../docs/ARCHITECTURE.md)

## 핵심 기능

### 1. 🔔 지능형 알림 — 접속 상태에 맞춘 채널 전환
앱을 보고 있는데 시스템 푸시까지 오면 알림이 중복됩니다. 프론트는 백엔드의 채널 라우팅(SSE/FCM)에 더해, **화면 활성 여부로 표시 방식을 한 번 더 거릅니다.**

```
SSE 연결(useSSE) — 앱 접속 중 실시간 수신
  ├─ 화면 Visible → 인앱 토스트만 (시스템 알림 중복 차단)
  └─ 화면 Hidden  → 브라우저 시스템 알림
FCM(useFCM) — 백그라운드/미접속 시 푸시 (firebase-messaging-sw.js)
+ 동일 알림 ID 10초 중복 차단 (데드락 방지)
```

관련 코드: [src/features/notification/](src/features/notification/) — `useSSE`, `useFCM`, `useNotificationHandlers`

### 2. 📷 카메라 영양제 인식
카메라로 영양제 병을 촬영해 AI 서버(FastAPI)로 전송하고, 촬영→리뷰→분석→결과 단계별 UI로 흐름을 안내합니다. SSR 환경에서 브라우저 전용 API(`window`, `navigator.mediaDevices`) 접근 가드를 적용했습니다.

### 3. 📊 분석 리포트
**Recharts**로 일일 섭취량 vs 상한 섭취량을 시각화하고 과다 섭취를 경고합니다.

### 4. 📱 PWA
`@ducanh2912/next-pwa`로 앱 수준 설치·오프라인 경험을 제공하고, 다크/라이트 모드를 지원합니다.

## 기술 스택

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router) · React 19 · TypeScript |
| Animation | Framer Motion |
| PWA | @ducanh2912/next-pwa |
| Notification | Firebase (FCM) + SSE |
| Visualization | Recharts |
| State | Context API + Custom Hooks |
| Network | Axios |

## 프로젝트 구조

```
src/
├── app/            # Next.js App Router (페이지·레이아웃)
├── features/       # 도메인별 기능
│   ├── camera/         # 카메라 촬영·분석 흐름
│   ├── notification/   # SSE/FCM 알림, 복약 처리
│   ├── reminders/      # 복용 알림 설정
│   ├── report/         # 분석 리포트
│   ├── my-supplements/ # 보유 영양제 관리
│   ├── login / signup / kakao_login / find-password  # 인증
│   └── home / mypage
├── components/     # 공통 UI 컴포넌트 (NotificationModal 등)
├── contexts/       # 전역 Context
├── hooks/          # 공통 훅
├── services/       # API 클라이언트
├── lib/            # firebase 등 초기화
└── layout/         # 레이아웃 구성

public/
├── firebase-messaging-sw.js  # FCM 백그라운드 수신·다중 복용 처리
└── icons / assets
```

## 시작하기

```bash
npm install
npm run dev   # http://localhost:3000
```

> FCM을 사용하려면 Firebase 환경 변수 설정이 필요합니다. 미설정 시에도 앱이 크래시하지 않도록 방어되어 있습니다(FCM 비활성 처리).
