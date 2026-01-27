# 약속 (Yaksok) AI Server

이 디렉토리는 약/영양제 객체 탐지 및 성분 분석을 위한 **FastAPI** 기반의 AI 서버입니다.
분석 파이프라인(YOLO 객체탐지 → 바코드 인식 → OCR 텍스트 추출)을 통해 사용자에게 정확한 정보를 제공합니다.

## 🚀 1. 핵심 기술 및 모델
- **Framework**: `FastAPI` (High Performance Async Framework)
- **AI Model**: `YOLO11` (Ultralytics YOLOv11 Nano/Medium)
    - 최신 객체 탐지 모델로 이미지 속 물체를 실시간으로 인식합니다.
- **Analysis Pipeline**:
    - **YOLO11**: 영양제 형태(Bottle, Box 등) 탐지
    - **PyZbar**: 바코드 추출 및 상품 데이터 매칭
    - **OCR (PaddleOCR)**: 제품명 및 성분 텍스트 추출
- **Libraries**: `ultralytics`, `opencv-python-headless`, `paddleocr`, `pyzbar`

## 📂 2. 프로젝트 구조
```bash
fastapi/
├── app/
│   ├── api/
│   │   └── endpoints.py     # API 라우터 (실제 요청 처리)
│   ├── services/
│   │   ├── yolo_service.py   # YOLO11 모델 로직
│   │   ├── ocr_service.py    # PaddleOCR 텍스트 추출 로직
│   │   └── analysis_service.py # 전체 통합 분석 파이프라인
│   └── main.py              # 서버 실행 및 앱 설정
├── venv/                    # 가상환경 (배포 환경)
├── requirements.txt         # 종속성 목록
└── README.md                # 분석 서버 가이드
```

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

### [POST] `/ai/v1/analyze`
프론트엔드에서 업로드한 이미지를 분석하여 결과를 반환합니다.

- **Request Body**: `multipart/form-data`
  - `file`: 이미지 파일 (JPEG, PNG 등)
- **Response**: `application/json`
  ```json
  {
    "status": "success",
    "result": {
      "is_supplement": true,
      "detected_objects": [...],
      "ocr_text": "타이레놀 500mg",
      "barcode": "8806418001234"
    }
  }
  ```

### [GET] `/test`
- 브라우저에서 직접 이미지를 업로드하고 결과를 확인할 수 있는 테스트 페이지를 제공합니다.

### [GET] `/docs` (Swagger UI)
- 자동 생성된 API 문서를 통해 모든 엔드포인트를 확인하고 직접 실행해 볼 수 있습니다.

## 📦 5. 모델 관리
`yolo11m.pt` 등 모델 파일은 서버 실행 시 `app/services/` 경로 혹은 루트 경로에서 자동으로 로드됩니다. 파일이 없을 경우 Ultralytics 공식 Repo에서 자동으로 다운로드됩니다.

