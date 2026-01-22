"""
배경/부정 샘플(Negative Samples) 수집 스크립트 v2
- Lorem Picsum API를 사용하여 랜덤 배경 이미지 다운로드
- YOLO 학습용 빈 라벨 파일 자동 생성
"""

import os
import requests
import time
from pathlib import Path

# ============ 설정 ============
# 이미지 저장 경로 (SAMPLE 폴더에 먼저 저장하여 확인)
OUTPUT_DIR = Path(__file__).parent / "SAMPLE"
IMAGES_DIR = OUTPUT_DIR / "images"
LABELS_DIR = OUTPUT_DIR / "labels"

# 다운로드할 총 이미지 수
TOTAL_IMAGES = 70

# ============ 함수 정의 ============

def download_image(url: str, save_path: Path) -> bool:
    """이미지 다운로드"""
    try:
        response = requests.get(url, timeout=15, allow_redirects=True)
        if response.status_code == 200 and len(response.content) > 1000:
            with open(save_path, "wb") as f:
                f.write(response.content)
            return True
    except Exception as e:
        print(f"  ❌ 다운로드 실패: {e}")
    return False


def create_empty_label(image_path: Path, labels_dir: Path):
    """빈 라벨 파일 생성 (부정 샘플용)"""
    label_name = image_path.stem + ".txt"
    label_path = labels_dir / label_name
    label_path.touch()  # 빈 파일 생성


def main():
    print("=" * 50)
    print("🖼️ 배경/부정 샘플 이미지 수집 시작 (Lorem Picsum)")
    print("=" * 50)
    
    # 폴더 생성
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    LABELS_DIR.mkdir(parents=True, exist_ok=True)
    
    total_downloaded = 0
    
    for i in range(TOTAL_IMAGES):
        # Lorem Picsum: 랜덤 이미지 제공 (640x480 해상도)
        # seed를 다르게 주면 다른 이미지가 나옴
        url = f"https://picsum.photos/seed/{i+100}/640/480"
        
        filename = f"bg_random_{i:03d}.jpg"
        save_path = IMAGES_DIR / filename
        
        # 이미 있으면 스킵
        if save_path.exists():
            print(f"⏭️ 이미 존재: {filename}")
            continue
        
        print(f"⬇️ 다운로드 중: {filename} ({i+1}/{TOTAL_IMAGES})")
        
        if download_image(url, save_path):
            create_empty_label(save_path, LABELS_DIR)
            total_downloaded += 1
            print(f"  ✅ 완료!")
        
        # 요청 간 딜레이 (서버 부하 방지)
        time.sleep(0.3)
    
    print("\n" + "=" * 50)
    print(f"🎉 수집 완료! 총 {total_downloaded}개 배경 이미지 추가됨")
    print(f"📁 이미지 경로: {IMAGES_DIR}")
    print(f"📁 라벨 경로: {LABELS_DIR}")
    print("=" * 50)


if __name__ == "__main__":
    main()
