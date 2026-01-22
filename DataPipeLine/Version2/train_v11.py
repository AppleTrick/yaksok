import os
from ultralytics import YOLO

def train_medicine_model():
    """
    YOLO11을 이용한 영양제(Medicine) 탐지 모델 학습 스크립트
    
    주의: 학습 전에 'Medicine Detection.v1i.yolov11/data.yaml' 파일 내의
    데이터 경로(train, val, test)가 실제 서버 환경의 경로와 일치하는지 확인해야 합니다.
    """
    
    # 1. 모델 설정 (Model Selection)
    # n: Nano (가중치 최소, 속도 최상, 모바일/임베디드 권장)
    # s: Small (속도와 성능의 균형)
    # m: Medium (추천! 서버 환경에서 가장 많이 선호됨)
    # l: Large (고성능, 높은 연산량)
    # x: Extra Large (최고 성능, 속도 느림)
    model = YOLO('yolo11m.pt') # 일반적으로 성능이 우수한 'm' 모델을 추천합니다.

    # 2. 데이터셋 설정 (Dataset Configuration)
    # data.yaml 파일의 절대 경로를 지정하는 것이 가장 확실합니다.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, 'Medicine Detection.v1i.yolov11', 'data.yaml')

    # 3. 모델 학습 (Training)
    # 주요 파라미터(옵션) 설명:
    # -------------------------------------------------------------
    # epochs: 전체 데이터셋을 총 몇 회 학습할지 결정. (기본 100, 보통 100~300 사이 권장)
    # imgsz: 이미지를 몇 픽셀로 리사이징하여 학습할지. (기본 640. 고해상도가 필요하면 1024 이상 설정 가능)
    # batch: 한 번에 처리할 이미지 묶음 크기. (GPU 메모리(VRAM) 크기에 맞춰 16, 32, 64 등으로 설정)
    # device: 연산 장치 지정 (0:첫 번째 GPU, [0,1]:두 개 GPU 사용, 'cpu':CPU 사용)
    # optimizer: 가중치를 업데이트하는 방식. ('auto', 'SGD', 'Adam', 'AdamW'. AdamW가 안정적임)
    # workers: 데이터 로딩에 사용할 CPU 스레드 수. (CPU 코어 수에 맞춰 4~16 설정)
    # patience: 성능 개선이 없는 경우 조기에 학습을 종료할 Epoch 횟수 (Early Stopping)
    # -------------------------------------------------------------
    
    model.train(
        data=data_path,        # 데이터 설정 파일 경로
        epochs=150,            # 넉넉하게 150회 학습
        imgsz=640,             # 정밀한 탐지가 필요하면 1024로 변경 가능 (성능 vs 속도 트레이드오프)
        batch=32,              # V100 등 고성능 서버 GPU라면 32 이상도 충분히 가능
        device=0,              # 첫 번째 GPU 사용
        optimizer='AdamW',     # 모델 학습 안정성을 위해 AdamW 선택
        lr0=0.01,              # 초기 학습률 (Learning Rate)
        lrf=0.01,              # 최종 학습률 비율 (lr0 * lrf)
        patience=30,           # 30 epoch 동안 성능 향상 없으면 멈춤
        workers=8,             # 데이터 읽어오는 속도 향상
        save=True,             # 학습 완료 후 가중치 저장
        project='Medicine_Detection', # 결과를 저장할 프로젝트 폴더명
        name='version2_yolo11m',     # 상세 실행 이름 (실행할 때마다 폴더 구분용)
        exist_ok=True,         # 이미 폴더가 있어도 오류 내지 않음
        pretrained=True        # 처음부터가 아닌 기존 YOLO 가중치 위에서 학습 시작
    )

    print("\n--- 학습 완료! ---")
    print("결과는 'Medicine_Detection/version2_yolo11m' 폴더에서 확인할 수 있습니다.")

    # 4. 검증 및 결과 확인 (Validation)
    # 학습된 최고 성능 모델(best.pt)을 사용하여 검증 수행
    results = model.val()
    print(f"최종 정밀도 (mAP50-95): {results.box.map}")

if __name__ == "__main__":
    train_medicine_model()
