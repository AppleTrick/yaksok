"""
Version3 학습 패키지 생성 스크립트
- 모든 데이터를 병합하여 Version3 폴더 생성
- YOLO 학습에 필요한 폴더 구조로 정리
"""

import os
import shutil
from pathlib import Path
import random

# ============ 설정 ============
BASE_DIR = Path(__file__).parent
OUTPUT_DIR = BASE_DIR.parent / "03_datasets" / "Version3"

# 데이터 소스
SOURCES = {
    "original": BASE_DIR.parent / "03_datasets" / "Version2" / "Medicine Detection.v1i.yolov11 (2)",
    "huseong": BASE_DIR.parent / "01_collection" / "huseong",
    "huseong_labels": BASE_DIR.parent / "01_collection" / "huseong" / "labels",
    "negative_samples": BASE_DIR.parent / "01_collection" / "negative_samples",
    "sample_bg": BASE_DIR.parent / "03_datasets" / "Version2" / "SAMPLE",
}

# Train/Val/Test 비율
TRAIN_RATIO = 0.8
VAL_RATIO = 0.15
TEST_RATIO = 0.05

# ============ 함수 정의 ============

def copy_with_label(img_path: Path, label_path: Path, dest_img_dir: Path, dest_label_dir: Path, prefix: str = ""):
    """이미지와 라벨을 함께 복사"""
    if not img_path.exists():
        return False
    
    # 새 파일명 (충돌 방지)
    new_name = f"{prefix}{img_path.name}" if prefix else img_path.name
    new_img_path = dest_img_dir / new_name
    new_label_path = dest_label_dir / (Path(new_name).stem + ".txt")
    
    # 이미지 복사
    shutil.copy2(img_path, new_img_path)
    
    # 라벨 복사 (없으면 빈 파일 생성)
    if label_path.exists():
        shutil.copy2(label_path, new_label_path)
    else:
        new_label_path.touch()
    
    return True


def collect_all_data():
    """모든 데이터 수집"""
    all_data = []  # [(img_path, label_path, prefix), ...]
    
    # 1. 원본 데이터 (Version2)
    print("📁 원본 데이터 수집 중...")
    for split in ["train", "valid", "test"]:
        img_dir = SOURCES["original"] / split / "images"
        label_dir = SOURCES["original"] / split / "labels"
        if img_dir.exists():
            for img_path in img_dir.glob("*.jpg"):
                label_path = label_dir / (img_path.stem + ".txt")
                all_data.append((img_path, label_path, "orig_"))
            for img_path in img_dir.glob("*.png"):
                label_path = label_dir / (img_path.stem + ".txt")
                all_data.append((img_path, label_path, "orig_"))
    print(f"   → {len(all_data)}개")
    
    # 2. huseong 크롤링 데이터
    print("📁 huseong 데이터 수집 중...")
    huseong_count = 0
    if SOURCES["huseong"].exists() and SOURCES["huseong_labels"].exists():
        for img_path in SOURCES["huseong"].glob("*.jpg"):
            label_path = SOURCES["huseong_labels"] / (img_path.stem + ".txt")
            # 라벨이 있고 비어있지 않은 것만 (검토 통과한 것)
            if label_path.exists():
                all_data.append((img_path, label_path, "hs_"))
                huseong_count += 1
    print(f"   → {huseong_count}개")
    
    # 3. COCO 부정 샘플
    print("📁 COCO 부정 샘플 수집 중...")
    coco_count = 0
    coco_img_dir = SOURCES["negative_samples"] / "images"
    coco_label_dir = SOURCES["negative_samples"] / "labels"
    if coco_img_dir.exists():
        for img_path in coco_img_dir.glob("*.jpg"):
            label_path = coco_label_dir / (img_path.stem + ".txt")
            all_data.append((img_path, label_path, "coco_"))
            coco_count += 1
    print(f"   → {coco_count}개")
    
    # 4. SAMPLE 배경 이미지
    print("📁 SAMPLE 배경 수집 중...")
    sample_count = 0
    sample_img_dir = SOURCES["sample_bg"] / "images"
    sample_label_dir = SOURCES["sample_bg"] / "labels"
    if sample_img_dir.exists():
        for img_path in sample_img_dir.glob("*.jpg"):
            label_path = sample_label_dir / (img_path.stem + ".txt")
            all_data.append((img_path, label_path, "bg_"))
            sample_count += 1
    print(f"   → {sample_count}개")
    
    return all_data


def main():
    print("=" * 60)
    print("📦 Version3 학습 패키지 생성 시작")
    print("=" * 60)
    
    # 출력 폴더 초기화
    if OUTPUT_DIR.exists():
        print(f"⚠️ 기존 {OUTPUT_DIR.name} 폴더 삭제 중...")
        shutil.rmtree(OUTPUT_DIR)
    
    # 폴더 구조 생성
    for split in ["train", "valid", "test"]:
        (OUTPUT_DIR / split / "images").mkdir(parents=True, exist_ok=True)
        (OUTPUT_DIR / split / "labels").mkdir(parents=True, exist_ok=True)
    
    # 데이터 수집
    all_data = collect_all_data()
    total = len(all_data)
    print(f"\n📊 총 데이터: {total}개")
    
    # 셔플
    random.seed(42)
    random.shuffle(all_data)
    
    # Train/Val/Test 분할
    train_end = int(total * TRAIN_RATIO)
    val_end = train_end + int(total * VAL_RATIO)
    
    splits = {
        "train": all_data[:train_end],
        "valid": all_data[train_end:val_end],
        "test": all_data[val_end:]
    }
    
    # 복사
    print("\n📝 데이터 복사 중...")
    for split_name, data_list in splits.items():
        img_dir = OUTPUT_DIR / split_name / "images"
        label_dir = OUTPUT_DIR / split_name / "labels"
        
        for img_path, label_path, prefix in data_list:
            copy_with_label(img_path, label_path, img_dir, label_dir, prefix)
        
        print(f"   {split_name}: {len(data_list)}개")
    
    # data.yaml 생성
    yaml_content = f"""# Version3 Supplement Detection Dataset
path: .
train: train/images
val: valid/images
test: test/images

nc: 1
names: ['supplement']
"""
    
    with open(OUTPUT_DIR / "data.yaml", "w") as f:
        f.write(yaml_content)
    
    print("\n" + "=" * 60)
    print("🎉 Version3 패키지 생성 완료!")
    print(f"   📁 경로: {OUTPUT_DIR}")
    print(f"   📊 Train: {len(splits['train'])}개")
    print(f"   📊 Valid: {len(splits['valid'])}개")
    print(f"   📊 Test: {len(splits['test'])}개")
    print("=" * 60)


if __name__ == "__main__":
    main()
