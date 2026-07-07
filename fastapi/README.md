# 약속 (Yak-Sok) AI Server

약/영양제 객체 탐지 및 성분 분석을 위한 **FastAPI** 기반 AI 서버입니다.

- **전체 서비스 문서**: 상위 [../README.md](../README.md) · [OCR 파이프라인 기술 리포트](../docs/report/OCR_PIPELINE_TECHNICAL_REPORT.md) · [데이터 파이프라인 리포트](../DataPipeLine/PROJECT_REPORT.md)

## 🚀 1. 분석 경로: 두 가지

| 경로 | 파이프라인 | 상태 |
|---|---|---|
| **`/ai/v1/analyze2`** (권장) | YOLO11 → Google Vision(Object Localization + OCR) → Gemini 제품명 정제 | 운영 사용 |
| `/ai/v1/analyze` (레거시) | YOLO11 → 자체 PaddleOCR | OCR 실패 시 빈 값 반환하는 안전 상태로 유지 |

레거시 경로는 ARM 환경에서 PaddleOCR 추론 세그폴트 위험이 있어 버전 핀 없이 무력화 상태로 둡니다. 상세 분석은 [OCR 파이프라인 기술 리포트](../docs/report/OCR_PIPELINE_TECHNICAL_REPORT.md) 참고.

## 핵심 기술

- **Framework**: FastAPI (async)
- **탐지 모델**: YOLOv11m — `DataPipeLine/`에서 Negative Sampling·라벨 검수로 학습 (V3: mAP@50 0.814)
- **OCR/정제**: Google Cloud Vision API + Gemini(`gemini-2.5-flash-lite`)
- **Libraries**: `ultralytics`, `opencv-python-headless`, `google-cloud-vision`, `paddleocr`(레거시 경로)

## 📂 2. 프로젝트 구조
```bash
fastapi/
├── app/
│   ├── api/
│   │   └── endpoints.py         # API 라우터 (/analyze, /analyze2)
│   ├── services/
│   │   ├── yolo_service.py      # YOLO11 객체 탐지
│   │   ├── vision_service.py    # Google Vision API 분석 (analyze2)
│   │   ├── llm_service.py       # Gemini 제품명 정제
│   │   ├── ocr_service.py       # PaddleOCR (레거시 analyze)
│   │   └── analysis_service.py  # 통합 분석 파이프라인
│   ├── utils.py
│   └── main.py                  # 서버 실행 및 앱 설정
├── model/                       # 학습된 YOLO 가중치(.pt)
├── requirements.txt
└── README.md
```

> ⚠️ `venv/`는 커밋·빌드 컨텍스트에 포함하지 마세요. `.dockerignore`에 `venv/`, `__pycache__/` 등을 추가해야 합니다(과거 빌드 컨텍스트 6.56GB 비대화 원인).

## 🛠️ 3. 설치 및 실행 (Setup & Run)

### 3-1. 가상환경 구성
```bash
# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (Windows)
.\venv\Scripts\activate
# 가상환경 활성화 (macOS/Linux)
source venv/bin/activate

# 패키지 설치
pip install -r requirements.txt
```

### 3-2. 서버 실행
```bash
# Uvicorn을 이용한 실행 (재시작 모드)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🔌 4. API 명세 (API Specification)

### [POST] `/ai/v1/analyze` (레거시)
YOLO + 자체 PaddleOCR 경로. OCR 실패 시 빈 값을 반환하는 안전 상태로 유지됩니다.

- **Request Body**: `multipart/form-data` — `file`: 이미지 (JPEG, PNG 등)
- **Response**: `application/json`

### [GET] `/test`
- 브라우저에서 직접 이미지를 업로드하고 결과를 확인할 수 있는 테스트 페이지를 제공합니다.

### [GET] `/docs` (Swagger UI)
- 자동 생성된 API 문서를 통해 모든 엔드포인트를 확인하고 직접 실행해 볼 수 있습니다.

## 📦 5. 모델 관리
`yolo11m.pt` 등 모델 파일은 서버 실행 시 `app/services/` 경로 혹은 루트 경로에서 자동으로 로드됩니다. 파일이 없을 경우 Ultralytics 공식 Repo에서 자동으로 다운로드됩니다.

## ☁️ 6. Google Cloud Vision API 설정 (신규)
`/analyze2` 엔드포인트를 사용하기 위해서는 Google Cloud 서비스 계정 키가 필요합니다.

1. Google Cloud Console에서 서비스 계정을 생성하고 키(JSON)를 다운로드합니다.
2. `fastapi/` 디렉토리에 키 파일을 두고, `.env`의 `GOOGLE_APPLICATION_CREDENTIALS`에
   파일명(또는 경로)을 설정합니다.

```env
# fastapi/.env
GOOGLE_APPLICATION_CREDENTIALS=visionkey.json
GEMINI_API_KEY=your_google_ai_studio_api_key
```

- `GOOGLE_APPLICATION_CREDENTIALS`: Vision API(객체 탐지 + OCR)용 서비스 계정 키 경로
- `GEMINI_API_KEY`: Vision API OCR 결과에서 정확한 제품명을 추출하는 LLM 정제 단계용 키.
  **SSAFY GMS 키가 아닌 Google AI Studio에서 발급한 개인 키**를 사용합니다
  (`llm_service.py`가 `generativelanguage.googleapis.com`을 직접 호출하며,
  현재 모델은 `gemini-2.5-flash-lite`).

### [POST] `/analyze2`
Google Cloud Vision API를 활용하여 정밀하게 영양제를 분석합니다.

- **기능**: Object Localization → Cropping → Individual OCR → Gemini 기반 제품명 정제
- **Request Body**: `multipart/form-data`
  - `file`: 이미지 파일 (JPEG, PNG 등 — 투명 채널이 있는 PNG도 지원)
- **Response**: `application/json` (List[Dict])
