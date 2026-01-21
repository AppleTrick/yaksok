"""
고급 자동 라벨링 스크립트 (YOLO-World 기반)
- 여러 객체 동시 검출 가능
- bottle과 box가 함께 있는 경우도 처리
- 텍스트 프롬프트 기반 Zero-shot Detection

사용법:
    python auto_labeler_advanced.py

필요 패키지:
    pip install ultralytics
"""

import os
import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO


def auto_label_with_yolo_world(
    images_dir: str,
    output_labels_dir: str,
    confidence_threshold: float = 0.1
):
    """
    YOLO-World를 사용한 고급 자동 라벨링
    - 여러 객체 동시 검출
    - bottle, box 모두 검출
    
    Args:
        images_dir: 이미지 폴더 경로 (bottle, box 하위 폴더 포함)
        output_labels_dir: 라벨 저장 폴더 경로
        confidence_threshold: 검출 신뢰도 임계값
    """
    
    print("🤖 YOLO-World 모델 로딩 중...")
    # YOLO-World 모델 로드 (zero-shot detection)
    model = YOLO('yolov8m-worldv2.pt')
    
    # 검출할 클래스 정의 (텍스트 프롬프트)
    # 다양한 표현으로 검출 확률 높임
    classes_to_detect = [
        "supplement bottle",
        "vitamin bottle", 
        "pill bottle",
        "medicine bottle",
        "plastic bottle",
        "supplement box",
        "vitamin box",
        "medicine box",
        "cardboard box",
        "product box",
        "package box"
    ]
    
    # 클래스 매핑 (검출된 클래스 → YOLO 클래스 ID)
    # bottle 관련 = 0, box 관련 = 1
    class_mapping = {
        "supplement bottle": 0,
        "vitamin bottle": 0,
        "pill bottle": 0,
        "medicine bottle": 0,
        "plastic bottle": 0,
        "supplement box": 1,
        "vitamin box": 1,
        "medicine box": 1,
        "cardboard box": 1,
        "product box": 1,
        "package box": 1
    }
    
    # 커스텀 클래스 설정
    model.set_classes(classes_to_detect)
    
    # 이미지 수집 (bottle, box 모든 폴더에서)
    all_images = []
    categories = ['bottle', 'box']
    
    for category in categories:
        img_dir = Path(images_dir) / category
        if img_dir.exists():
            for img_file in img_dir.iterdir():
                if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    all_images.append({
                        'path': img_file,
                        'category': category
                    })
    
    print(f"📁 총 {len(all_images)}개 이미지 처리 시작...")
    
    stats = {
        'success': 0,
        'no_detection': 0,
        'error': 0,
        'multi_object': 0,
        'mixed_class': 0  # bottle + box 함께 있는 경우
    }
    
    for i, item in enumerate(all_images):
        img_path = item['path']
        category = item['category']
        
        try:
            # 이미지 로드
            image = cv2.imread(str(img_path))
            if image is None:
                stats['error'] += 1
                continue
            
            h, w = image.shape[:2]
            
            # YOLO-World 예측
            results = model.predict(
                str(img_path),
                conf=confidence_threshold,
                verbose=False
            )
            
            # 라벨 디렉토리 생성
            label_dir = Path(output_labels_dir) / category
            label_dir.mkdir(parents=True, exist_ok=True)
            label_path = label_dir / f"{img_path.stem}.txt"
            
            detections = []
            detected_classes = set()
            
            for r in results:
                for box in r.boxes:
                    # 클래스 이름 가져오기
                    cls_idx = int(box.cls[0])
                    cls_name = classes_to_detect[cls_idx] if cls_idx < len(classes_to_detect) else None
                    
                    if cls_name is None:
                        continue
                    
                    # 우리 클래스 ID로 매핑
                    our_class_id = class_mapping.get(cls_name)
                    if our_class_id is None:
                        continue
                    
                    detected_classes.add(our_class_id)
                    
                    # 좌표 추출
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    
                    # YOLO 형식으로 변환 (정규화)
                    center_x = ((x1 + x2) / 2) / w
                    center_y = ((y1 + y2) / 2) / h
                    box_w = (x2 - x1) / w
                    box_h = (y2 - y1) / h
                    
                    # 유효한 박스인지 확인
                    if box_w > 0.01 and box_h > 0.01:  # 최소 크기 필터
                        detections.append({
                            'class_id': our_class_id,
                            'cx': center_x,
                            'cy': center_y,
                            'w': box_w,
                            'h': box_h,
                            'conf': conf
                        })
            
            # 중복 제거 (IoU 기반)
            detections = remove_duplicate_boxes(detections, iou_threshold=0.5)
            
            # 라벨 파일 저장
            with open(label_path, 'w') as f:
                for det in detections:
                    f.write(f"{det['class_id']} {det['cx']:.6f} {det['cy']:.6f} {det['w']:.6f} {det['h']:.6f}\n")
            
            # 통계 업데이트
            if len(detections) == 0:
                stats['no_detection'] += 1
                status = "⚠️ 검출없음"
            else:
                stats['success'] += 1
                if len(detections) > 1:
                    stats['multi_object'] += 1
                if len(detected_classes) > 1:
                    stats['mixed_class'] += 1
                status = f"✅ {len(detections)}개 객체"
            
            print(f"[{i+1}/{len(all_images)}] {status}: {category}/{img_path.name}")
            
        except Exception as e:
            stats['error'] += 1
            print(f"[{i+1}/{len(all_images)}] ❌ 오류: {img_path.name} - {e}")
    
    return stats


def remove_duplicate_boxes(detections, iou_threshold=0.5):
    """IoU 기반 중복 박스 제거 (NMS)"""
    if len(detections) <= 1:
        return detections
    
    # 신뢰도 기준 정렬
    detections = sorted(detections, key=lambda x: x['conf'], reverse=True)
    
    keep = []
    while detections:
        best = detections.pop(0)
        keep.append(best)
        
        remaining = []
        for det in detections:
            iou = calculate_iou(best, det)
            if iou < iou_threshold:
                remaining.append(det)
        
        detections = remaining
    
    return keep


def calculate_iou(box1, box2):
    """두 박스의 IoU 계산"""
    # 중심좌표 → 모서리 좌표 변환
    x1_1 = box1['cx'] - box1['w'] / 2
    y1_1 = box1['cy'] - box1['h'] / 2
    x2_1 = box1['cx'] + box1['w'] / 2
    y2_1 = box1['cy'] + box1['h'] / 2
    
    x1_2 = box2['cx'] - box2['w'] / 2
    y1_2 = box2['cy'] - box2['h'] / 2
    x2_2 = box2['cx'] + box2['w'] / 2
    y2_2 = box2['cy'] + box2['h'] / 2
    
    # 교집합
    inter_x1 = max(x1_1, x1_2)
    inter_y1 = max(y1_1, y1_2)
    inter_x2 = min(x2_1, x2_2)
    inter_y2 = min(y2_1, y2_2)
    
    if inter_x2 <= inter_x1 or inter_y2 <= inter_y1:
        return 0.0
    
    inter_area = (inter_x2 - inter_x1) * (inter_y2 - inter_y1)
    
    # 합집합
    area1 = box1['w'] * box1['h']
    area2 = box2['w'] * box2['h']
    union_area = area1 + area2 - inter_area
    
    return inter_area / union_area if union_area > 0 else 0.0


def fallback_simple_label(images_dir, output_labels_dir):
    """
    YOLO-World 검출 실패 시 폴백: 간단한 중앙 박스 라벨링
    """
    print("\n⚠️ YOLO-World 실패, 간단한 방식으로 폴백...")
    
    categories = {'bottle': 0, 'box': 1}
    
    for category, class_id in categories.items():
        img_dir = Path(images_dir) / category
        label_dir = Path(output_labels_dir) / category
        label_dir.mkdir(parents=True, exist_ok=True)
        
        if not img_dir.exists():
            continue
        
        for img_file in img_dir.iterdir():
            if img_file.suffix.lower() not in ['.jpg', '.jpeg', '.png', '.webp']:
                continue
            
            label_path = label_dir / f"{img_file.stem}.txt"
            
            # 이미 라벨이 있으면 스킵
            if label_path.exists() and label_path.stat().st_size > 0:
                continue
            
            # 이미지 로드하여 패딩 영역 계산
            image = cv2.imread(str(img_file))
            if image is None:
                continue
            
            h, w = image.shape[:2]
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # 패딩 감지
            top_pad = 0
            for row in range(h):
                if np.mean(gray[row, :]) > 10:
                    top_pad = row
                    break
            
            bottom_pad = 0
            for row in range(h-1, -1, -1):
                if np.mean(gray[row, :]) > 10:
                    bottom_pad = h - row - 1
                    break
            
            left_pad = 0
            for col in range(w):
                if np.mean(gray[:, col]) > 10:
                    left_pad = col
                    break
            
            right_pad = 0
            for col in range(w-1, -1, -1):
                if np.mean(gray[:, col]) > 10:
                    right_pad = w - col - 1
                    break
            
            # 콘텐츠 영역의 80%를 박스로
            margin = 0.1
            content_x1 = left_pad
            content_y1 = top_pad
            content_x2 = w - right_pad
            content_y2 = h - bottom_pad
            
            box_x1 = content_x1 + (content_x2 - content_x1) * margin
            box_y1 = content_y1 + (content_y2 - content_y1) * margin
            box_x2 = content_x2 - (content_x2 - content_x1) * margin
            box_y2 = content_y2 - (content_y2 - content_y1) * margin
            
            center_x = ((box_x1 + box_x2) / 2) / w
            center_y = ((box_y1 + box_y2) / 2) / h
            box_w = (box_x2 - box_x1) / w
            box_h = (box_y2 - box_y1) / h
            
            with open(label_path, 'w') as f:
                f.write(f"{class_id} {center_x:.6f} {center_y:.6f} {box_w:.6f} {box_h:.6f}\n")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='고급 자동 라벨링 (YOLO-World)')
    parser.add_argument('--images', default='../data/processed',
                        help='이미지 폴더 경로')
    parser.add_argument('--labels', default='../data/labels',
                        help='라벨 저장 폴더 경로')
    parser.add_argument('--conf', type=float, default=0.1,
                        help='검출 신뢰도 임계값 (낮을수록 더 많이 검출)')
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("     🚀 고급 자동 라벨링 (YOLO-World)")
    print("=" * 50)
    print(f"이미지 폴더: {args.images}")
    print(f"라벨 저장: {args.labels}")
    print(f"신뢰도 임계값: {args.conf}")
    print("=" * 50)
    print("\n✨ 특징:")
    print("  - 여러 객체 동시 검출")
    print("  - bottle + box 함께 있어도 각각 검출")
    print("  - 중복 박스 자동 제거 (NMS)")
    print("=" * 50)
    
    try:
        stats = auto_label_with_yolo_world(
            args.images, 
            args.labels,
            args.conf
        )
        
        print("\n" + "=" * 50)
        print("     📊 자동 라벨링 완료!")
        print("=" * 50)
        print(f"✅ 성공: {stats['success']}개")
        print(f"⚠️ 검출 없음: {stats['no_detection']}개")
        print(f"❌ 오류: {stats['error']}개")
        print(f"📦 다중 객체: {stats['multi_object']}개")
        print(f"🔀 혼합 클래스 (bottle+box): {stats['mixed_class']}개")
        print("=" * 50)
        
        # 검출 없는 이미지에 폴백 적용
        if stats['no_detection'] > 0:
            print(f"\n📌 검출 없는 {stats['no_detection']}개에 폴백 라벨 적용 중...")
            fallback_simple_label(args.images, args.labels)
            print("✅ 폴백 완료!")
        
    except Exception as e:
        print(f"\n❌ YOLO-World 실행 오류: {e}")
        print("간단한 방식으로 폴백합니다...")
        fallback_simple_label(args.images, args.labels)
    
    print("\n⚡ 다음 단계:")
    print("1. 라벨 검수: python label_reviewer.py --mode review")
    print("2. 데이터셋 구성: python prepare_dataset.py")
    print("3. 학습 시작: python train_yolo11.py")


if __name__ == "__main__":
    main()
