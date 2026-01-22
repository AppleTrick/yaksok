import os
from ultralytics import YOLO

def train_supplement_model():
    """
    YOLO11m을 이용한 영양제(supplement) 탐지 모델 학습 스크립트
    """
    
    # 1. 모델 설정 (YOLO11m 모델 사용)
    model = YOLO('yolo11m.pt')

    # 2. 데이터셋 설정 (현재 폴더의 data.yaml 경로 자동 설정)
    current_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_folder = 'Medicine Detection.v1i.yolov11 (2)'
    data_path = os.path.join(current_dir, dataset_folder, 'data.yaml')

    # 3. 모델 학습 (Training)
    print(f"학습 시작... (데이터 경로: {data_path})")
    
    results_path = model.train(
        data=data_path,        # 데이터 설정 파일 경로
        epochs=150,            # 150회 학습
        imgsz=640,             # 이미지 크기
        batch=16,              # 배치 사이즈 (GPU VRAM에 따라 조절 가능)
        device=0,              # GPU 0번 사용
        optimizer='AdamW',     # Optimizer
        patience=30,           # Early Stopping
        workers=8,             # 병렬 데이터 로딩
        save=True,             # 가중치 저장
        project='Supplement_Detection', # 프로젝트 폴더명
        name='Version2',       # 실행 이름 (Version2)
        exist_ok=True,         # 폴더 중복 허용
        pretrained=True        # 사전 학습된 가중치 사용
    )

    print("\n--- 학습 완료! ---")
    
    # 4. 결과 파일명 변경 (best.pt -> Version2.pt)
    import shutil
    best_model_path = os.path.join('Supplement_Detection', 'Version2', 'weights', 'best.pt')
    final_model_path = os.path.join('Supplement_Detection', 'Version2', 'weights', 'Version2.pt')
    
    if os.path.exists(best_model_path):
        shutil.copy(best_model_path, final_model_path)
        print(f"최종 모델이 저장되었습니다: {final_model_path}")
    
    print("결과는 'Supplement_Detection/Version2' 폴더에서 확인할 수 있습니다.")

    # 5. 검증 (Validation)
    val_results = model.val()
    print(f"최종 성능 (mAP50-95): {val_results.box.map}")

if __name__ == "__main__":
    train_supplement_model()
