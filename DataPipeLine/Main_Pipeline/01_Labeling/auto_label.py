"""
반자동 라벨링 스크립트
- Version2.pt 모델로 huseong 폴더의 이미지를 예측
- YOLO 형식 라벨 파일(.txt) 자동 생성
"""

import os
from pathlib import Path
from ultralytics import YOLO

# ============ 설정 ============
# 모델 경로 (Version2.pt)
MODEL_PATH = Path(r"c:\Users\SSAFY\Desktop\project\team\S14P11A505\fastapi\Version2.pt")

# 입력 이미지 폴더 (01_collection/huseong)
INPUT_DIR = Path(__file__).parent.parent.parent / "01_collection" / "huseong"

# 출력 라벨 폴더
OUTPUT_DIR = INPUT_DIR / "labels"

# 신뢰도 임계값 (이 값 이상만 라벨로 저장)
CONFIDENCE_THRESHOLD = 0.3

# ============ 메인 함수 ============

def main():
    print("=" * 60)
    print("🏷️ 반자동 라벨링 시작")
    print("=" * 60)
    
    # 모델 로드
    if not MODEL_PATH.exists():
        print(f"❌ 모델 파일을 찾을 수 없습니다: {MODEL_PATH}")
        return
    
    print(f"📦 모델 로드 중: {MODEL_PATH}")
    model = YOLO(str(MODEL_PATH))
    
    # 출력 폴더 생성
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 이미지 파일 목록
    image_files = list(INPUT_DIR.glob("*.jpg")) + list(INPUT_DIR.glob("*.png"))
    total = len(image_files)
    print(f"📁 총 {total}개 이미지 발견\n")
    
    labeled_count = 0
    empty_count = 0
    
    for idx, img_path in enumerate(image_files, 1):
        # 예측 실행
        results = model(str(img_path), conf=CONFIDENCE_THRESHOLD, verbose=False)
        
        # 라벨 파일 경로
        label_path = OUTPUT_DIR / (img_path.stem + ".txt")
        
        # 결과 저장
        labels = []
        for r in results:
            boxes = r.boxes
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0])
                    # YOLO 형식: class x_center y_center width height (정규화)
                    xywhn = box.xywhn[0].tolist()
                    labels.append(f"{cls_id} {xywhn[0]:.6f} {xywhn[1]:.6f} {xywhn[2]:.6f} {xywhn[3]:.6f}")
        
        # 라벨 파일 저장
        with open(label_path, "w") as f:
            f.write("\n".join(labels))
        
        if labels:
            labeled_count += 1
            status = f"✅ {len(labels)}개 객체"
        else:
            empty_count += 1
            status = "⬜ 객체 없음"
        
        # 진행률 출력 (50개마다)
        if idx % 50 == 0 or idx == total:
            print(f"[{idx}/{total}] {img_path.name}: {status}")
    
    print("\n" + "=" * 60)
    print(f"🎉 라벨링 완료!")
    print(f"   - 객체 탐지됨: {labeled_count}개 이미지")
    print(f"   - 객체 없음: {empty_count}개 이미지")
    print(f"   - 라벨 저장 경로: {OUTPUT_DIR}")
    print("=" * 60)
    print("\n💡 다음 단계: review_labels.py 실행하여 라벨 검토")


if __name__ == "__main__":
    main()
