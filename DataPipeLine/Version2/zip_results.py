import shutil
import os

def zip_training_results():
    # 1. 압축할 결과 폴더 경로 (노트북 설정 기준)
    result_folder = 'Supplement_Detection/Version2'
    
    # 2. 생성될 압축 파일명 (확장자 제외)
    output_filename = 'Supplement_Version2_Final_Results'
    
    if os.path.exists(result_folder):
        print(f"📦 '{result_folder}' 폴더와 결과물을 압축하는 중...")
        
        # shutil.make_archive(파일명, 포맷, 압축할폴더)
        archive_path = shutil.make_archive(output_filename, 'zip', result_folder)
        
        print("-" * 50)
        print(f"✅ 압축 완료: {os.path.abspath(archive_path)}")
        print("💡 이제 이 파일을 다운로드하시면 됩니다.")
        print("-" * 50)
    else:
        print(f"❌ 오류: '{result_folder}' 폴더를 찾을 수 없습니다. 학습이 완료되었는지 확인하세요.")

if __name__ == "__main__":
    zip_training_results()
