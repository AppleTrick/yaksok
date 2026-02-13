# 💊 약속 (Yak-Sok) - 스마트 영양제 관리 및 분석 서비스

> **"당신의 건강한 습관을 위한 확실한 약속"**  
> AI 기반 영양제 병 인식부터 지능형 섭취 알림까지, 개인 맞춤형 영양 관리 솔루션입니다.

---

## 📖 프로젝트 소개 (Introduction)

**약속 (Yak-Sok)**은 사용자가 복잡한 영양제 섭취 일정을 손쉽게 관리하고, 과다 섭취 위험 없는 안전한 건강 생활을 영위할 수 있도록 돕는 웹/모바일 플랫폼입니다.  
최신 **YOLOv11** 기반의 객체 탐지 기술을 활용하여 영양제 병을 자동으로 인식하고, **OCR** 기술을 통해 성분 정보를 분석합니다. 또한, 사용자의 섭취 패턴을 학습하여 최적의 시간에 알림을 제공하는 **지능형 알림 시스템**을 탑재하고 있습니다.

---

## ✨ 주요 기능 (Key Features)

### 1. 🔍 AI 기반 영양제 탐지 및 분석 (AI Vision)
- **고성능 객체 탐지**: **YOLOv11m** 모델을 기반으로 다양한 환경(조명, 각도, 배경)에서도 높은 정확도로 영양제 병을 실시간 탐지합니다.
- **데이터 파이프라인 고도화 (v3)**: 
  - **Negative Sampling**: 텀블러, 컵 등 유사 물체의 오탐지(False Positive)를 획기적으로 줄이기 위해 배경 이미지를 포함한 Hard Negative Mining 적용.
  - **Human-in-the-loop**: `review_labels.py` 검수 도구를 통한 라벨링 정확도 99% 달성.
  - 최종 모델 성능: **mAP@50 0.90 이상** 달성.
- **OCR 성분 추출**: 촬영된 영양제의 라벨 텍스트를 인식하여 주요 성분 함량을 분석합니다.

### 2. 🔔 지능형 알림 시스템 (Smart Notification)
- **중복 알림 방지 (Smart Routing)**:
  - 사용자가 앱에 접속 중(SSE 연결)일 때는 **인앱 토스트**로, 비접속 시에는 **FCM 푸시**로 알림을 자동 전환하여 피로도를 최소화합니다.
- **묶음 알송 (Bundling)**:
  - 동일 시간대에 섭취해야 할 여러 영양제 알림을 하나로 통합하여 발송합니다. ("비타민C 외 2건 섭취 시간입니다.")
- **가시성 필터링**: 화면 활성화 여부(Visible/Hidden)를 감지하여 알림 방식을 동적으로 최적화합니다.

### 3. 📊 개인 맞춤형 리포트 및 관리
- **영양 성분 분석 리포트**: 
  - 일일 섭취량과 상한 섭취량을 비교 분석하여 **과다 섭취 경고(Warning)**를 제공합니다.
  - 직관적인 그래프(**Recharts**)를 통해 영양 상태를 시각화합니다.
- **타임라인 및 섭취 기록**:
  - 드래그 앤 드롭 또는 원클릭으로 손쉬운 섭취 기록 관리.
  - 다크 모드/라이트 모드를 완벽 지원하는 반응형 UI.
- **나의 영양제 관리**: 보유 중인 영양제 목록과 잔여량을 한눈에 확인 가능.

---

## 🛠 기술 스택 (Tech Stack)

### **Frontend**
- **Framework**: Alert Next.js 16 (React 19, TypeScript)
- **Styling**: Tailwind CSS, Framer Motion (애니메이션)
- **PWA**: `@ducanh2912/next-pwa` (앱 수준의 사용자 경험 제공)
- **Notification**: Google Firebase (FCM)
- **Visualization**: Recharts (데이터 시각화)
- **State Management**: Context API & Custom Hooks
- **Network**: Axios

### **Backend**
- **Framework**: Spring Boot (Java)
- **Architecture**: RESTful API
- **Data Access**: JPA / Hibernate
- **Notification Logic**: SSE (Server-Sent Events) + FCM Token Management
- **Database**: MySQL/MariaDB (추정)

### **AI & Data Pipeline**
- **Model**: YOLOv11m (Medium)
- **Language**: Python 3.x
- **Framework**: PyTorch, Ultralytics YOLO
- **Serving**: FastAPI (AI 서버)
- **Preprocessing**: Albumentations (데이터 증강), OpenCV
- **Tools**: COCO Dataset Filtering, Custom Labeling Tools (`auto_label.py`, `review_labels.py`)

---

## 📂 프로젝트 구조 (Project Structure)

```
S14P11A505/
├── backend/            # Spring Boot 백엔드 소스 코드 (API, DB, 알림 로직)
│   └── yaksok/         # 메인 애플리케이션
├── frontend/           # Next.js 프론트엔드 소스 코드 (UI/UX, PWA)
├── fastapi/            # AI 모델 서빙 및 추론 API (Python)
├── DataPipeLine/       # AI 학습 데이터 구축 및 파이프라인
│   ├── Main_Pipeline/  # 전처리, 라벨링, 학습 스크립트
│   └── PROJECT_REPORT.md # 데이터 파이프라인 상세 리포트
└── README.md           # 프로젝트 메인 문서
```

---

## 🚀 시작하기 (Getting Started)

### Prerequisites
- Node.js > 20.x
- Java JDK 17+
- Python 3.8+
- Docker (Optional)

### Installation

1. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend**
   ```bash
   cd backend/yaksok
   ./gradlew bootRun
   ```

3. **AI Server**
   ```bash
   cd fastapi
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

---

## 👨‍💻 팀원 및 기여 (Contributors)

팀장 : 박창희
팀원 : 하윤철, 박종현, 이유정, 허승 , 김태희