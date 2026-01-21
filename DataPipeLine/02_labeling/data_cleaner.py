"""
데이터 정제 스크립트
- 극단적인 비율의 이미지 자동 제거
- 이미지를 하나씩 검토하며 수동 필터링 가능
"""

import os
import shutil
from PIL import Image
import argparse

def get_image_ratio(image_path):
    """이미지의 가로세로 비율 계산"""
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            ratio = max(width/height, height/width)
            return ratio, width, height
    except Exception as e:
        print(f"Error reading {image_path}: {e}")
        return None, None, None

def auto_filter_extreme_ratios(source_dir, rejected_dir, max_ratio=3.0):
    """
    극단적인 비율의 이미지를 자동으로 rejected 폴더로 이동
    max_ratio: 허용할 최대 가로세로 비율 (기본 3:1)
    """
    os.makedirs(rejected_dir, exist_ok=True)
    
    rejected_count = 0
    kept_count = 0
    
    for category in ['bottle', 'box']:
        category_path = os.path.join(source_dir, category)
        rejected_category = os.path.join(rejected_dir, category)
        
        if not os.path.exists(category_path):
            continue
            
        os.makedirs(rejected_category, exist_ok=True)
        
        for filename in os.listdir(category_path):
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                continue
                
            filepath = os.path.join(category_path, filename)
            ratio, w, h = get_image_ratio(filepath)
            
            if ratio is None:
                continue
                
            if ratio > max_ratio:
                # 극단적인 비율 → rejected로 이동
                shutil.move(filepath, os.path.join(rejected_category, filename))
                print(f"❌ Rejected: {filename} (ratio: {ratio:.2f}, {w}x{h})")
                rejected_count += 1
            else:
                kept_count += 1
    
    print(f"\n{'='*50}")
    print(f"자동 필터링 완료!")
    print(f"- 유지: {kept_count}개")
    print(f"- 제거: {rejected_count}개 (→ {rejected_dir})")
    print(f"{'='*50}")
    
    return kept_count, rejected_count

def manual_review(source_dir, rejected_dir):
    """
    이미지를 하나씩 보며 수동 검토
    y: 유지, n: 제거, q: 종료
    """
    try:
        import cv2
    except ImportError:
        print("OpenCV가 필요합니다: pip install opencv-python")
        return
    
    os.makedirs(rejected_dir, exist_ok=True)
    
    for category in ['bottle', 'box']:
        category_path = os.path.join(source_dir, category)
        rejected_category = os.path.join(rejected_dir, category)
        
        if not os.path.exists(category_path):
            continue
            
        os.makedirs(rejected_category, exist_ok=True)
        
        files = [f for f in os.listdir(category_path) 
                 if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        
        print(f"\n=== {category} 폴더 검토 ({len(files)}개) ===")
        print("y: 유지 | n: 제거 | q: 종료")
        
        for i, filename in enumerate(files):
            filepath = os.path.join(category_path, filename)
            
            # 이미지 표시
            img = cv2.imread(filepath)
            if img is None:
                continue
                
            # 화면에 맞게 리사이즈
            h, w = img.shape[:2]
            max_size = 800
            if max(h, w) > max_size:
                scale = max_size / max(h, w)
                img = cv2.resize(img, (int(w*scale), int(h*scale)))
            
            cv2.imshow(f'{category} - {i+1}/{len(files)}', img)
            
            print(f"[{i+1}/{len(files)}] {filename}")
            key = cv2.waitKey(0) & 0xFF
            
            cv2.destroyAllWindows()
            
            if key == ord('n'):
                shutil.move(filepath, os.path.join(rejected_category, filename))
                print(f"  → 제거됨")
            elif key == ord('q'):
                print("검토 종료")
                return
            else:
                print(f"  → 유지")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='데이터 정제 도구')
    parser.add_argument('--mode', choices=['auto', 'manual'], default='auto',
                        help='auto: 자동 비율 필터링, manual: 수동 검토')
    parser.add_argument('--source', default='data/processed',
                        help='원본 이미지 폴더')
    parser.add_argument('--rejected', default='data/rejected',
                        help='제거된 이미지 저장 폴더')
    parser.add_argument('--max-ratio', type=float, default=3.0,
                        help='허용할 최대 가로세로 비율 (auto 모드)')
    
    args = parser.parse_args()
    
    if args.mode == 'auto':
        print("🔄 극단적 비율 이미지 자동 필터링 중...")
        auto_filter_extreme_ratios(args.source, args.rejected, args.max_ratio)
    else:
        print("👁️ 수동 검토 모드 시작...")
        manual_review(args.source, args.rejected)
