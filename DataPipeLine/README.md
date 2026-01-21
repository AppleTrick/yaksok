# 💊 영양제 분석 모델 데이터 파이프라인 (YOLO11)

이 프로젝트는 YOLO11 모델 학습을 위해 영양제(통/박스) 이미지를 수집, 가공, 자동 라벨링 및 학습시키는 통합 파이프라인입니다.

## 📂 폴더 구조

```text
DataPipeLine/
├── 01_collection/           # 1단계: 데이터 수집 및 전처리
│   ├── main.py              # 전체 수집 파이프라인 실행
│   ├── crawler.py           # Selenium 기반 이미지 크롤러
│   └── preprocessor.py      # 이미지 리사이징 및 화질 개선
│
├── 02_labeling/             # 2단계: 데이터 정제 및 라벨링
│   ├── data_cleaner.py      # 가로세로 비율 기반 자동 정제 및 수동 검토
│   ├── auto_labeler_advanced.py # YOLO-World 기반 다중 객체 자동 라벨링
│   └── label_reviewer.py    # 시각적 라벨 검수 도구 (R키로 선별)
│
├── 03_training/             # 3단계: 학습 데이터 구성 및 실행
│   ├── prepare_dataset.py   # YOLO 포맷 변환 및 Train/Val 분할
│   ├── train_yolo11.py      # 로컬 성능 테스트용 학습 스크립트
│   └── v100_train.ipynb     # V100 GPU 서버용 학습용 노트북
│
├── data/                    # [공용] 원본, 전처리, 라벨링 데이터 저장소
├── datasets/                # [공용] 최종 YOLO 학습용 데이터셋 구조
├── requirements.txt         # 필수 패키지 목록
└── v100_upload.zip          # 🚀 V100 서버 전송용 통합 압축 파일
```

## 🚀 빠른 시작 가이드

### 1. 패키지 설치
```bash
pip install -r requirements.txt
```

### 2. 데이터 수집 및 가공
```bash
cd 01_collection
python main.py
```

### 3. 자동 라벨링 및 검수
```bash
cd ../02_labeling
python auto_labeler_advanced.py  # AI 기반 자동 라벨링
python label_reviewer.py --mode review  # 결과 검수 (D: 통과, R: 수정대상, Q: 종료)
```

### 4. 학습 준비 및 서버 전송
```bash
cd ../03_training
python prepare_dataset.py  # 데이터셋 분할 및 data.yaml 생성
```
*생성된 `v100_upload.zip` 파일을 V100 주피터 서버에 업로드 후 `v100_train.ipynb` 실행*

## 🛠️ 주요 기능
- **고급 자동 라벨링**: YOLO-World 모델을 사용하여 텍스트만으로 여러 객체를 한 번에 검출.
- **V100 특화**: 클라우드 GPU 서버(V100) 환경에서 즉시 학습 가능한 노트북 제공.
- **검수 워크플로우**: 자동 라벨링 후 사람이 빠르게 확인하고 수정 대상을 선별하는 '반자동' 시스템.
