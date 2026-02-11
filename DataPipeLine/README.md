# 📊 Supplement Detection Project Results

이 리포지토리는 영양제 객체 탐지 모델의 **개발 과정과 최종 성과(Results)**를 기록한 아카이브입니다.
각 버전별로 다른 데이터 접근 방식을 적용하였으며, 최종적으로 **V3 모델**이 가장 우수한 성능을 보였습니다.

## 📂 Version History & Data Sources

### 🏛️ Version 1: Baseline
- **Data Source**: **기본적인 웹 데이터 (Basic Web Data)**
- **Description**: 웹 검색을 통해 수집한 소규모의 영양제 이미지로 학습된 초기 모델입니다.
- **Outcome**: 개념 증명(PoC) 단계로, 제한적인 환경에서만 탐동.
- **Results**: `RESULT/supplements_v100_v1/`

### 🏛️ Version 2: Enhanced
- **Data Source**: **추가적으로 공개된 데이터 (Public Datasets)**
- **Description**: Roboflow 등 공개된 영양제/약병 데이터셋을 추가하여 데이터 양을 늘리고, 조명/각도 변화에 대응했습니다.
- **Outcome**: 탐지율은 상승했으나, 일상 생활의 잡동사니(컵, 텀블러 등)를 오탐지하는 문제 발생.
- **Results**: `RESULT/Supplement_Version2_Final_Results/`

### 🚀 Version 3: Final (Production Ready)
- **Data Source**: **COCO 데이터 + 웹 크롤링 데이터 + 부정 데이터 (Negative Samples)**
  1. **Web Crawling**: 타겟팅된 고품질 이미지 수집.
  2. **Negative Data**: COCO 데이터셋에서 'Bottle'이 없는 이미지를 추출하여 학습(Hard Negative Mining).
  3. **Data Cleaning**: `review_labels.py`를 통한 정밀 검수.
- **Outcome**: 오탐지(False Positive)가 획기적으로 감소하고, 다양한 실생활 환경에서 안정적인 성능 확보.
- **Results**: `RESULT/Supplement_Version3_Final_Results/`

## 📈 Performance Analysis
자세한 성능 비교 분석은 **[Analysis_Report.ipynb](Analysis_Report.ipynb)**를 참고하세요.

## 🛠️ Repository Structure
- **`RESULT/`**: 각 버전별 학습 로그, 그래프, 성능 지표 저장소.
- **`Main_Pipeline/`**: V3 모델을 재현하기 위한 전체 코드 (라벨링, 전처리, 학습).
- **`Legacy_History/`**: 이전 버전의 모델 가중치 백업.
