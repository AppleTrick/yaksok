"""
COCO 데이터셋에서 부정 샘플(Negative) 추출
- COCO val2017에서 'bottle' 클래스가 없는 이미지만 추출
- 빈 라벨 파일 자동 생성
"""

import os
import json
import requests
import zipfile
from pathlib import Path

# ============ 설정 ============
# 출력 폴더
OUTPUT_DIR = Path(__file__).parent / "negative_samples"
IMAGES_DIR = OUTPUT_DIR / "images"
LABELS_DIR = OUTPUT_DIR / "labels"

# 다운로드할 이미지 수
TARGET_COUNT = 200

# COCO 카테고리 ID (bottle = 44)
BOTTLE_CATEGORY_ID = 44

# ============ 함수 정의 ============

def download_file(url: str, save_path: Path):
    """파일 다운로드"""
    if save_path.exists():
        print(f"⏭️ 이미 존재: {save_path.name}")
        return True
    
    try:
        print(f"⬇️ 다운로드 중: {url}")
        response = requests.get(url, stream=True, timeout=30)
        if response.status_code == 200:
            with open(save_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"❌ 다운로드 실패: {e}")
    return False


def main():
    print("=" * 60)
    print("📦 COCO 부정 샘플 추출 시작")
    print("=" * 60)
    
    # 폴더 생성
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    LABELS_DIR.mkdir(parents=True, exist_ok=True)
    
    # COCO 어노테이션 다운로드 URL (val2017)
    annotations_url = "http://images.cocodataset.org/annotations/annotations_trainval2017.zip"
    annotations_zip = OUTPUT_DIR / "annotations.zip"
    annotations_dir = OUTPUT_DIR / "annotations"
    
    # 어노테이션 다운로드
    if not annotations_dir.exists():
        if download_file(annotations_url, annotations_zip):
            print("📂 압축 해제 중...")
            with zipfile.ZipFile(annotations_zip, "r") as zip_ref:
                zip_ref.extractall(OUTPUT_DIR)
            print("✅ 어노테이션 준비 완료")
    
    # 어노테이션 파일 로드
    instances_path = annotations_dir / "instances_val2017.json"
    if not instances_path.exists():
        print(f"❌ 어노테이션 파일을 찾을 수 없습니다: {instances_path}")
        return
    
    print("📖 어노테이션 로드 중...")
    with open(instances_path, "r") as f:
        coco_data = json.load(f)
    
    # bottle이 포함된 이미지 ID 수집
    bottle_image_ids = set()
    for ann in coco_data["annotations"]:
        if ann["category_id"] == BOTTLE_CATEGORY_ID:
            bottle_image_ids.add(ann["image_id"])
    
    print(f"🍾 bottle 포함 이미지: {len(bottle_image_ids)}개")
    
    # bottle이 없는 이미지 필터링
    negative_images = [
        img for img in coco_data["images"]
        if img["id"] not in bottle_image_ids
    ]
    
    print(f"⬜ bottle 없는 이미지: {len(negative_images)}개")
    print(f"🎯 목표: {TARGET_COUNT}개 다운로드\n")
    
    # 이미지 다운로드
    downloaded = 0
    for img_info in negative_images[:TARGET_COUNT * 2]:  # 여유있게 시도
        if downloaded >= TARGET_COUNT:
            break
        
        img_url = img_info["coco_url"]
        img_name = img_info["file_name"]
        img_path = IMAGES_DIR / img_name
        label_path = LABELS_DIR / (Path(img_name).stem + ".txt")
        
        # 이미지 다운로드
        if download_file(img_url, img_path):
            # 빈 라벨 파일 생성
            label_path.touch()
            downloaded += 1
            
            if downloaded % 20 == 0:
                print(f"📊 진행률: {downloaded}/{TARGET_COUNT}")
    
    print("\n" + "=" * 60)
    print(f"🎉 부정 샘플 수집 완료!")
    print(f"   - 다운로드: {downloaded}개 이미지")
    print(f"   - 이미지 경로: {IMAGES_DIR}")
    print(f"   - 라벨 경로: {LABELS_DIR}")
    print("=" * 60)
    print("\n💡 이 이미지들은 영양제가 없는 배경 이미지입니다.")
    print("   학습 데이터에 추가하면 오탐(False Positive)을 줄일 수 있습니다.")


if __name__ == "__main__":
    main()
