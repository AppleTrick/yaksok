"""
라벨 검토 프로그램 (GUI)
- 이미지와 바운딩 박스를 함께 보여줌
- 키보드로 승인/삭제 결정
- 'y': 승인 (다음으로)
- 'n': 삭제 (이미지+라벨 삭제)
- 'q': 종료
"""

import os
import cv2
from pathlib import Path

# ============ 설정 ============
# 이미지 폴더 (01_collection/huseong)
IMAGE_DIR = Path(__file__).parent.parent.parent / "01_collection" / "huseong"
# 라벨 폴더
LABEL_DIR = IMAGE_DIR / "labels"
# 삭제된 파일 저장 폴더 (복구용)
TRASH_DIR = IMAGE_DIR / "trash"

# ============ 함수 정의 ============

def load_labels(label_path: Path) -> list:
    """라벨 파일 로드"""
    if not label_path.exists():
        return []
    with open(label_path, "r") as f:
        lines = f.readlines()
    return [line.strip().split() for line in lines if line.strip()]


def draw_boxes(image, labels, img_w, img_h):
    """바운딩 박스 그리기"""
    for label in labels:
        if len(label) < 5:
            continue
        cls_id, x_center, y_center, width, height = map(float, label[:5])
        
        # 정규화 좌표 -> 픽셀 좌표
        x1 = int((x_center - width / 2) * img_w)
        y1 = int((y_center - height / 2) * img_h)
        x2 = int((x_center + width / 2) * img_w)
        y2 = int((y_center + height / 2) * img_h)
        
        # 박스 그리기
        cv2.rectangle(image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(image, f"supplement", (x1, y1 - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
    return image


def main():
    print("=" * 60)
    print("🔍 라벨 검토 프로그램")
    print("=" * 60)
    print("조작법:")
    print("  [Y] 또는 [→]: 승인 (다음으로)")
    print("  [N] 또는 [Delete]: 삭제 (이미지+라벨 휴지통으로)")
    print("  [Q] 또는 [ESC]: 종료")
    print("=" * 60)
    
    # 폴더 생성
    TRASH_DIR.mkdir(parents=True, exist_ok=True)
    
    # 라벨 파일 목록 (라벨이 있는 이미지만)
    label_files = list(LABEL_DIR.glob("*.txt"))
    # 비어있지 않은 라벨만 필터링
    label_files = [lf for lf in label_files if lf.stat().st_size > 0]
    
    total = len(label_files)
    if total == 0:
        print("❌ 검토할 라벨 파일이 없습니다. 먼저 auto_label.py를 실행하세요.")
        return
    
    print(f"📁 검토할 라벨: {total}개\n")
    
    approved = 0
    deleted = 0
    
    for idx, label_path in enumerate(label_files):
        # 이미지 경로 찾기
        img_path = None
        for ext in [".jpg", ".png", ".jpeg"]:
            candidate = IMAGE_DIR / (label_path.stem + ext)
            if candidate.exists():
                img_path = candidate
                break
        
        if img_path is None:
            print(f"⚠️ 이미지 없음: {label_path.stem}")
            continue
        
        # 이미지 로드
        image = cv2.imread(str(img_path))
        if image is None:
            continue
        
        img_h, img_w = image.shape[:2]
        
        # 라벨 로드 및 박스 그리기
        labels = load_labels(label_path)
        image_with_boxes = draw_boxes(image.copy(), labels, img_w, img_h)
        
        # 정보 표시
        info_text = f"[{idx+1}/{total}] {img_path.name} - {len(labels)} objects"
        cv2.putText(image_with_boxes, info_text, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.putText(image_with_boxes, "Y:Approve  N:Delete  Q:Quit", (10, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        
        # 창 표시
        cv2.imshow("Label Review", image_with_boxes)
        
        # 키 입력 대기
        while True:
            key = cv2.waitKey(0) & 0xFF
            
            if key == ord('y') or key == 83:  # Y 또는 →
                approved += 1
                break
            elif key == ord('n') or key == 255:  # N 또는 Delete
                # 휴지통으로 이동
                img_path.rename(TRASH_DIR / img_path.name)
                label_path.rename(TRASH_DIR / label_path.name)
                deleted += 1
                print(f"🗑️ 삭제됨: {img_path.name}")
                break
            elif key == ord('q') or key == 27:  # Q 또는 ESC
                cv2.destroyAllWindows()
                print(f"\n⏹️ 검토 중단")
                print(f"   - 승인: {approved}개")
                print(f"   - 삭제: {deleted}개")
                print(f"   - 남은 파일: {total - idx}개")
                return
    
    cv2.destroyAllWindows()
    print("\n" + "=" * 60)
    print(f"🎉 검토 완료!")
    print(f"   - 승인: {approved}개")
    print(f"   - 삭제: {deleted}개")
    print(f"   - 휴지통: {TRASH_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
