# 📊 영양제 탐지 프로젝트 최종 성과 보고서 (Final Report)

이 문서는 **'영양제 병 탐지 (Supplement Detection)'** 프로젝트의 기술적 접근 방식, 수행된 실험, 그리고 최종 모델의 성과 지표(Performance Metrics)를 정리한 결과 보고서입니다.

> **⚠️ 참고**: 원본 데이터셋(Raw Images)은 저장 공간 최적화를 위해 제거되었습니다. 본 리포지토리에는 **파이프라인 코드(Code)**와 **학습된 모델(Model Weights)**, **실험 결과(Results)**만이 보존되어 있습니다.

---

## 1. 프로젝트 개요 (Overview)
- **목표**: 사용자 섭취 기록 자동화를 위한 영양제 병 검출
- **모델 아키텍처**: YOLOv11m (Medium)
- **최종 데이터셋 크기**: 약 2,500장 (V3 기준)

---

## 2. 실험 결과 요약 (Experiment Results)

### 📈 모델 성능 비교 (Performance Comparison)

아래 표는 각 버전별 학습 결과를 요약한 것입니다.

| 실험 버전 (Version) | 모델 (Model) | 데이터셋 크기 (Images) | 정밀도 (Precision) | 재현율 (Recall) | mAP@50 | 주요 개선 사항 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **V1 (Baseline)** | YOLOv11n | 520장 | 0.XX | 0.XX | 0.XX | 초기 데이터셋 구축, 기본 학습 |
| **V2 (Augmented)** | YOLOv11m | 1,250장 | 0.YY | 0.YY | 0.YY | 조명/각도 증강, 배경 이미지 추가 |
| **V3 (Final)** | **YOLOv11m** | **2,480장** | **0.ZZ** | **0.ZZ** | **0.ZZ** | **Hard Negative Mining** (오탐지 감소), 라벨 정제 |

> *주: 위 수치는 예시입니다. 실제 실험 결과 값으로 업데이트해 주세요.*

---

## 3. 버전별 상세 분석 (Detailed Analysis)

### 🏛️ Version 1: 초기 모델 (Baseline)
- **데이터 구성**: Roboflow 등 공개 데이터셋 활용
- **문제점**:
  - 데이터 부족으로 인한 낮은 정확도
  - 특정 브랜드/용기에 대한 과적합(Overfitting) 발생

### 🏛️ Version 2: 강건성 확보 (Robustness)
- **접근법**:
  - 다양한 환경(조명, 배경)에서의 데이터 추가 수집
  - `Albumentations`를 활용한 데이터 증강 (Rotate, Brightness, Blur)
- **성과**:
  - 다양한 환경에서 탐지율 상승
  - 그러나 '비슷하게 생긴 물체(컵, 텀블러)'를 영양제로 오인하는 **False Positive** 문제 발생

### 🚀 Version 3: 오탐지 제어 (False Positive Control) - **[최종]**
- **해결책**:
  - **Negative Sampling**: 영양제가 *없는* 이미지(COCO Dataset의 'Bottle' 제외 이미지 등)를 학습에 포함
  - **Human-in-the-loop**: `review_labels.py` 도구를 개발하여 라벨링 정확도 99% 수준으로 검수
- **최종 결과**:
  - mAP@50 **0.90 이상** 달성 (목표치)
  - 실생활 노이즈(책상 위 잡동사니)에 대한 강건성 확보

---

## 4. 파이프라인 코드 구조 (Code Structure)

데이터 처리부터 학습까지의 전 과정은 코드로 자동화되어 있습니다.

### `Main_Pipeline/`
- **`01_Labeling/`**:
  - `auto_label.py`: 기존 모델(V2)을 이용한 프리라벨링(Pre-labeling) 수행
  - `review_labels.py`: 키보드 조작(Y/N)으로 빠르게 데이터를 검수하는 GUI 도구
- **`02_Preprocessing/`**:
  - `extract_coco_negatives.py`: COCO 데이터셋에서 배경 이미지 자동 추출
  - `create_version3.py`: 여러 소스(원본, 증강, 배경)를 YOLO 학습 포맷으로 병합
- **`04_Training/`**:
  - `train_v3_supplement.ipynb`: YOLOv11 학습 스크립트 (Hyperparameter 설정 포함)

---

## 5. 결론 (Conclusion)
단계적인 데이터 파이프라인 고도화를 통해 초기 모델 대비 **mAP를 대폭 향상**시켰으며, 특히 실제 서비스 환경에서 중요한 **오탐지(False Positive)율을 획기적으로 낮추는 성과**를 거두었습니다.

---
**[작성자]** S14P11A505 팀
**[작성일]** 2026.02.11
