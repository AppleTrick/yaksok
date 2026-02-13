"""
Version3 학습 패키지 ZIP 압축 스크립트
- Version3 폴더와 Jupyter 노트북을 함께 압축
"""

import shutil
from pathlib import Path

BASE_DIR = Path(__file__).parent
VERSION3_DIR = BASE_DIR.parent / "03_Dataset"
OUTPUT_ZIP = BASE_DIR.parent / "04_Training" / "YOLO11m_Training_V3"

def main():
    print("=" * 60)
    print("📦 Version3 학습 패키지 ZIP 압축")
    print("=" * 60)
    
    if not VERSION3_DIR.exists():
        print(f"❌ Version3 폴더를 찾을 수 없습니다: {VERSION3_DIR}")
        return
    
    # ZIP 압축
    print(f"📁 압축 중: {VERSION3_DIR}")
    archive_path = shutil.make_archive(str(OUTPUT_ZIP), 'zip', BASE_DIR.parent, '03_Dataset')
    
    print("\n" + "=" * 60)
    print(f"🎉 압축 완료!")
    print(f"   📁 ZIP 파일: {archive_path}")
    print(f"   💡 이 파일을 외부 Jupyter 서버에 업로드하세요.")
    print("=" * 60)

if __name__ == "__main__":
    main()
