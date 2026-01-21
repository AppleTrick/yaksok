"""
라벨 검수 도구
자동 라벨링 결과를 시각적으로 확인하고 수정할 수 있는 도구

사용법:
    python label_reviewer.py

키보드 단축키:
    D: 다음 이미지
    A: 이전 이미지
    R: 현재 라벨 삭제 (재라벨링 필요로 표시)
    Q: 종료
    S: 현재 상태 저장
"""

import os
import cv2
import numpy as np
from pathlib import Path
import shutil


def load_yolo_labels(label_path, img_width, img_height):
    """YOLO 형식 라벨 로드 및 픽셀 좌표로 변환"""
    boxes = []
    if not os.path.exists(label_path):
        return boxes
    
    with open(label_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 5:
                class_id = int(parts[0])
                cx, cy, w, h = map(float, parts[1:5])
                
                # 픽셀 좌표로 변환
                x1 = int((cx - w/2) * img_width)
                y1 = int((cy - h/2) * img_height)
                x2 = int((cx + w/2) * img_width)
                y2 = int((cy + h/2) * img_height)
                
                boxes.append({
                    'class_id': class_id,
                    'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2
                })
    
    return boxes


def draw_boxes(image, boxes, class_names):
    """이미지에 바운딩 박스 그리기"""
    result = image.copy()
    
    colors = {
        0: (0, 255, 0),    # bottle - 초록
        1: (255, 0, 0)     # box - 파랑
    }
    
    for box in boxes:
        class_id = box['class_id']
        color = colors.get(class_id, (0, 255, 255))
        class_name = class_names.get(class_id, f'class_{class_id}')
        
        # 박스 그리기
        cv2.rectangle(result, (box['x1'], box['y1']), (box['x2'], box['y2']), color, 2)
        
        # 라벨 텍스트
        label = f"{class_name}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        cv2.rectangle(result, (box['x1'], box['y1'] - 20), (box['x1'] + tw + 4, box['y1']), color, -1)
        cv2.putText(result, label, (box['x1'] + 2, box['y1'] - 5), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    
    return result


def review_labels(
    images_dir='../data/processed',
    labels_dir='../data/labels',
    needs_review_dir='../data/needs_review'
):
    """라벨 검수 시작"""
    
    class_names = {0: 'bottle', 1: 'box'}
    os.makedirs(needs_review_dir, exist_ok=True)
    
    # 모든 이미지 수집
    all_images = []
    for category in ['bottle', 'box']:
        img_dir = Path(images_dir) / category
        label_dir = Path(labels_dir) / category
        
        if not img_dir.exists():
            continue
        
        for img_file in img_dir.iterdir():
            if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                label_file = label_dir / f"{img_file.stem}.txt"
                all_images.append({
                    'image': img_file,
                    'label': label_file,
                    'category': category
                })
    
    if not all_images:
        print("❌ 이미지를 찾을 수 없습니다.")
        return
    
    print(f"\n📊 검수할 이미지: {len(all_images)}개")
    print("\n[키보드 단축키]")
    print("  D: 다음 | A: 이전 | R: 재라벨링 필요 표시 | Q: 종료")
    print("-" * 50)
    
    current_idx = 0
    reviewed_count = 0
    needs_review_count = 0
    
    while True:
        item = all_images[current_idx]
        img_path = item['image']
        label_path = item['label']
        category = item['category']
        
        # 이미지 로드
        image = cv2.imread(str(img_path))
        if image is None:
            current_idx = (current_idx + 1) % len(all_images)
            continue
        
        h, w = image.shape[:2]
        
        # 라벨 로드
        boxes = load_yolo_labels(str(label_path), w, h)
        
        # 박스 그리기
        display = draw_boxes(image, boxes, class_names)
        
        # 정보 표시
        info = f"[{current_idx + 1}/{len(all_images)}] {category}/{img_path.name}"
        cv2.putText(display, info, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(display, f"Boxes: {len(boxes)}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(display, "D:Next A:Prev R:NeedsReview Q:Quit", (10, h - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)
        
        # 화면에 맞게 리사이즈
        max_display_size = 900
        if max(h, w) > max_display_size:
            scale = max_display_size / max(h, w)
            display = cv2.resize(display, (int(w * scale), int(h * scale)))
        
        cv2.imshow('Label Reviewer', display)
        
        key = cv2.waitKey(0) & 0xFF
        
        if key == ord('q'):
            break
        elif key == ord('d'):
            # 다음
            current_idx = (current_idx + 1) % len(all_images)
            reviewed_count += 1
        elif key == ord('a'):
            # 이전
            current_idx = (current_idx - 1) % len(all_images)
        elif key == ord('r'):
            # 재라벨링 필요 표시 - needs_review 폴더로 복사
            review_category_dir = Path(needs_review_dir) / category
            review_category_dir.mkdir(parents=True, exist_ok=True)
            
            shutil.copy2(img_path, review_category_dir / img_path.name)
            if label_path.exists():
                shutil.copy2(label_path, review_category_dir / label_path.name)
            
            print(f"⚠️ 재라벨링 필요 표시: {img_path.name}")
            needs_review_count += 1
            current_idx = (current_idx + 1) % len(all_images)
    
    cv2.destroyAllWindows()
    
    print("\n" + "=" * 50)
    print("     📊 검수 완료!")
    print("=" * 50)
    print(f"검토한 이미지: {reviewed_count}개")
    print(f"재라벨링 필요: {needs_review_count}개")
    if needs_review_count > 0:
        print(f"\n📁 재라벨링 필요 파일 위치: {needs_review_dir}")
        print("→ labelImg로 해당 폴더를 열어 수정하세요.")


def quick_stats(images_dir='data/processed', labels_dir='data/labels'):
    """라벨 통계 빠른 확인"""
    print("\n📊 라벨 통계")
    print("-" * 40)
    
    for category in ['bottle', 'box']:
        img_dir = Path(images_dir) / category
        label_dir = Path(labels_dir) / category
        
        if not img_dir.exists():
            continue
        
        total_images = len(list(img_dir.glob("*.[jJpPwW][pPnNeE][gGgGbB]*")))
        
        labeled = 0
        empty_labels = 0
        total_boxes = 0
        
        if label_dir.exists():
            for label_file in label_dir.glob("*.txt"):
                content = label_file.read_text().strip()
                if content:
                    labeled += 1
                    total_boxes += len(content.split('\n'))
                else:
                    empty_labels += 1
        
        print(f"\n📦 {category.upper()}")
        print(f"  총 이미지: {total_images}개")
        print(f"  라벨 있음: {labeled}개")
        print(f"  빈 라벨: {empty_labels}개")
        print(f"  라벨 없음: {total_images - labeled - empty_labels}개")
        print(f"  총 박스 수: {total_boxes}개")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='라벨 검수 도구')
    parser.add_argument('--mode', choices=['review', 'stats'], default='stats',
                        help='review: 시각적 검수, stats: 통계만 확인')
    parser.add_argument('--images', default='../data/processed',
                        help='이미지 폴더 경로')
    parser.add_argument('--labels', default='../data/labels',
                        help='라벨 폴더 경로')
    
    args = parser.parse_args()
    
    if args.mode == 'stats':
        quick_stats(args.images, args.labels)
    else:
        review_labels(args.images, args.labels)
