"""
YOLO11 모델 학습 스크립트
영양제(bottle/box) 객체 검출 모델 학습
"""

import os
import argparse
from pathlib import Path

def check_ultralytics():
    """ultralytics 패키지 확인"""
    try:
        from ultralytics import YOLO
        return True
    except ImportError:
        print("❌ ultralytics 패키지가 설치되어 있지 않습니다.")
        print("다음 명령어로 설치하세요:")
        print("  pip install ultralytics")
        return False

def train_model(
    data_yaml='datasets/supplements/data.yaml',
    model_size='m',  # n, s, m, l, x
    epochs=100,
    imgsz=640,
    batch_size=16,
    device='0',  # GPU 번호 또는 'cpu'
    project='runs/train',
    name='supplements_yolo11'
):
    """
    YOLO11 모델 학습
    
    Args:
        data_yaml: 데이터셋 설정 파일 경로
        model_size: 모델 크기 (n/s/m/l/x)
        epochs: 학습 에폭 수
        imgsz: 입력 이미지 크기
        batch_size: 배치 사이즈
        device: 사용할 GPU (0, 1, ... 또는 'cpu')
        project: 결과 저장 프로젝트 폴더
        name: 실험 이름
    """
    
    if not check_ultralytics():
        return None
    
    from ultralytics import YOLO
    
    # 데이터셋 확인
    if not os.path.exists(data_yaml):
        print(f"❌ 데이터셋 설정 파일이 없습니다: {data_yaml}")
        print("먼저 prepare_dataset.py를 실행하세요.")
        return None
    
    print("="*50)
    print("     YOLO11 영양제 검출 모델 학습")
    print("="*50)
    print(f"📊 데이터셋: {data_yaml}")
    print(f"🤖 모델: yolo11{model_size}")
    print(f"⚙️ Epochs: {epochs}")
    print(f"📐 Image Size: {imgsz}")
    print(f"📦 Batch Size: {batch_size}")
    print(f"💻 Device: {device}")
    print("="*50)
    
    # YOLO11 모델 로드 (pretrained)
    model_name = f'yolo11{model_size}.pt'
    print(f"\n📥 모델 로드 중: {model_name}")
    model = YOLO(model_name)
    
    # 학습 시작
    print("\n🚀 학습 시작!")
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        project=project,
        name=name,
        
        # 추가 학습 설정
        patience=20,          # Early stopping patience
        save=True,            # 체크포인트 저장
        save_period=10,       # N 에폭마다 저장
        cache=True,           # 이미지 캐싱 (메모리 여유시)
        workers=8,            # 데이터 로딩 워커 수
        
        # 증강 설정
        augment=True,
        hsv_h=0.015,          # 색조 변화
        hsv_s=0.7,            # 채도 변화
        hsv_v=0.4,            # 밝기 변화
        degrees=10,           # 회전 각도
        translate=0.1,        # 이동
        scale=0.5,            # 스케일
        fliplr=0.5,           # 좌우 반전
        mosaic=1.0,           # 모자이크 증강
    )
    
    # 결과 출력
    print("\n" + "="*50)
    print("     ✅ 학습 완료!")
    print("="*50)
    print(f"📁 결과 저장 위치: {project}/{name}")
    print(f"🏆 Best 모델: {project}/{name}/weights/best.pt")
    print(f"📊 마지막 모델: {project}/{name}/weights/last.pt")
    
    return results

def validate_model(model_path, data_yaml):
    """학습된 모델 검증"""
    if not check_ultralytics():
        return None
    
    from ultralytics import YOLO
    
    model = YOLO(model_path)
    results = model.val(data=data_yaml)
    
    print("\n📊 검증 결과:")
    print(f"  mAP50: {results.box.map50:.4f}")
    print(f"  mAP50-95: {results.box.map:.4f}")
    
    return results

def predict_image(model_path, image_path, save_dir='runs/predict'):
    """이미지에서 객체 검출"""
    if not check_ultralytics():
        return None
    
    from ultralytics import YOLO
    
    model = YOLO(model_path)
    results = model.predict(
        source=image_path,
        save=True,
        project=save_dir,
        conf=0.5
    )
    
    return results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='YOLO11 영양제 검출 모델 학습')
    parser.add_argument('--mode', choices=['train', 'val', 'predict'], default='train',
                        help='실행 모드')
    parser.add_argument('--data', default='../datasets/supplements/data.yaml',
                        help='데이터셋 설정 파일')
    parser.add_argument('--model-size', default='m', choices=['n', 's', 'm', 'l', 'x'],
                        help='YOLO11 모델 크기')
    parser.add_argument('--epochs', type=int, default=100,
                        help='학습 에폭 수')
    parser.add_argument('--imgsz', type=int, default=640,
                        help='입력 이미지 크기')
    parser.add_argument('--batch', type=int, default=16,
                        help='배치 사이즈')
    parser.add_argument('--device', default='0',
                        help='GPU 번호 (cpu 사용시 "cpu")')
    parser.add_argument('--model-path', default=None,
                        help='검증/예측시 사용할 모델 경로')
    parser.add_argument('--image', default=None,
                        help='예측할 이미지 경로 (predict 모드)')
    
    args = parser.parse_args()
    
    if args.mode == 'train':
        train_model(
            data_yaml=args.data,
            model_size=args.model_size,
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch_size=args.batch,
            device=args.device
        )
    elif args.mode == 'val':
        if not args.model_path:
            args.model_path = 'runs/train/supplements_yolo11/weights/best.pt'
        validate_model(args.model_path, args.data)
    elif args.mode == 'predict':
        if not args.model_path:
            args.model_path = 'runs/train/supplements_yolo11/weights/best.pt'
        if not args.image:
            print("❌ --image 인자가 필요합니다")
        else:
            predict_image(args.model_path, args.image)
