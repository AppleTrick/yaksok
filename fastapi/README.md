# 약속 (Yaksok) AI Server

이 디렉토리는 약/영양제 객체 탐지 및 성분 분석을 위한 **FastAPI** 기반의 AI 서버입니다.
Python 환경에 익숙하지 않더라도 아래 가이드를 따르면 쉽게 실행하고 테스트할 수 있습니다.

## 1. 사용된 기술 및 모델
- **Framework**: FastAPI (고성능 비동기 Python 웹 프레임워크)
- **AI Model**: **YOLO11** (Ultralytics YOLOv11 Nano)
    - 최신 객체 탐지 모델로, 빠르고 정확하게 이미지 속 물체를 인식합니다.
    - 서버 최초 실행 시 `yolo11n.pt` 모델 파일을 자동으로 다운로드합니다.
- **Library**: `ultralytics`, `opencv`, `pillow` (이미지 처리)

## 2. 프로젝트 구조
```bash
fastapi/
├── app/
│   ├── api/
│   │   └── endpoints.py   # API 라우터 정의 (실제 요청 처리)
│   ├── services/
│   │   └── ai_service.py  # AI 모델 로드 및 추론 로직 (YOLO11)
│   └── main.py            # 서버 실행 진입점 및 테스트 페이지 설정
├── requirements.txt       # 필요한 파이썬 라이브러리 목록
└── README.md              # 설명서 (현재 파일)
```

## 3. 실행 방법 (Usage)

### 3-1. 가상환경 생성 및 실행
Python 패키지 관리를 위해 가상환경(`venv`)을 사용합니다. 터미널에서 `S14P11A505/fastapi` 폴더로 이동한 뒤 아래 명령어를 차례로 입력하세요.

**1. 가상환경 생성 (최초 1회만)**
```bash
python3 -m venv venv
```

**2. 가상환경 활성화**
(터미널을 껐다 켤 때마다 해줘야 합니다. 활성화되면 터미널 앞에 `(venv)`가 뜹니다.)
```bash
source venv/bin/activate
```

**3. 라이브러리 설치 (최초 1회만)**
```bash
pip install -r requirements.txt
```

### 3-2. 서버 실행
가상환경이 활성화된 상태에서 아래 명령어로 서버를 켭니다.
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- `--reload`: 코드를 수정하면 서버가 자동으로 재시작됩니다.

## 4. 기능 및 동작 방식

### 💡 API 테스트 페이지 (Frontend 없이 확인)
서버가 켜져 있다면 브라우저에서 아래 주소로 접속해 보세요.
- **주소**: [http://localhost:8000/test](http://localhost:8000/test)
- **기능**: 이미지 파일 업로드 폼을 제공합니다.
- **확인**: '파일 선택' -> 이미지 업로드 -> 'Analyze' 클릭 -> JSON 분석 결과 확인.

### 🔌 API 엔드포인트

1.  **POST `/api/v1/analyze`**
    - **역할**: 프론트엔드(Next.js)에서 보낸 사진을 받아 분석합니다.
    - **입력**: `multipart/form-data` 형식의 이미지 파일 (`file`)
    - **동작**:
        1. 이미지를 메모리로 읽어옵니다.
        2. YOLO11 모델에 주입하여 객체를 탐지합니다.
        3. 탐지된 객체(label, confidence, 좌표)를 JSON으로 반환합니다.
        4. (현재 로직): 'bottle', 'cup', 'orange' 등이 감지되면 '영양제(is_supplement: true)'로 판단하는 임시 로직이 들어있습니다.

2.  **GET `/docs`**
    - **역할**: Swagger UI (자동 생성된 API 문서)
    - 여기서도 API를 직접 테스트해 볼 수 있습니다.
