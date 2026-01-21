import os
import sys
from crawler import SupplementCrawler
from preprocessor import ImagePreprocessor

def main():
    # --- 설정 영역 ---
    # 검색할 키워드 목록 (다양한 변형을 포함하여 더 많은 이미지 수집)
    keywords = [
        # 한글 키워드 - 통/병
        '영양제 통',
        '비타민 통',
        '건강기능식품 병',
        '영양제 병',
        '종합비타민 용기',
        '프로바이오틱스 통',
        '오메가3 병',
        '약통 영양제',
        '알약통',
        
        # 한글 키워드 - 박스/패키지
        '영양제 박스',
        '건강식품 박스',
        '비타민 패키지',
        '건강기능식품 상자',
        '영양제 포장',
        '종합비타민 박스',
        
        # 영어 키워드 - Bottle
        'supplements bottle',
        'vitamin bottle',
        'dietary supplement container',
        'pill bottle supplements',
        'health supplement bottle',
        'omega 3 bottle',
        'probiotics bottle',
        'multivitamin bottle',
        
        # 영어 키워드 - Box
        'supplements box',
        'vitamin packaging box',
        'supplement package',
        'dietary supplement box',
        'health product packaging',
        'vitamin box packaging',
        
        # 라벨/상세
        '건강기능식품 라벨',
        '영양제 라벨',
        'supplement label',
        'vitamin label design',
    ]
    # 검색어당 수집할 최대 이미지 수 (대량 수집)
    max_images_per_keyword = 50  
    
    # 데이터 저장 경로 설정 (상위 폴더의 data 폴더 참조)
    raw_dir = '../data/raw'           # 원본 수집 데이터
    processed_dir = '../data/processed' # 전처리 완료 데이터
    
    # --- 1단계: 이미지 크롤링 (수집) ---
    print("=== [1단계] 이미지 수집 시작 ===")
    # 고화질 이미지 필터링 조건이 내장된 크롤러 객체 생성
    crawler = SupplementCrawler(download_path=raw_dir)
    total_found, total_saved_raw = crawler.crawl(keywords, max_images=max_images_per_keyword)
    
    print(f"\n[수집 완료 요약]")
    print(f"- 검색 결과 총 후보 건수: {total_found}")
    print(f"- 조건(고해상도/용량)을 충족하여 저장된 수: {total_saved_raw}")

    # --- 2단계: 이미지 전처리 (리사이징 및 강화) ---
    print("\n=== [2단계] 이미지 전처리 및 강화 시작 ===")
    # 1280x1280 크기로 리사이징하는 전처리기 생성
    preprocessor = ImagePreprocessor(target_size=(1280, 1280))
    
    total_processed = 0
    subfolders = ['bottle', 'box'] # 분류된 서브 폴더들
    
    for sub in subfolders:
        input_sub = os.path.join(raw_dir, sub)
        output_sub = os.path.join(processed_dir, sub)
        
        if os.path.exists(input_sub):
            print(f"'{sub}' 폴더 처리 중...")
            count = preprocessor.process_folder(input_sub, output_sub)
            total_processed += count
            print(f" - {sub} 폴더 내 {count}개 이미지 처리 완료")

    # --- 3단계: 최종 결과 리포트 출력 ---
    print("\n" + "="*50)
    print("           데이터 파이프라인 최종 리포트")
    print("="*50)
    print(f"1. 크롤링 단계:")
    print(f"   - 검색 키워드 수: {len(keywords)}개")
    print(f"   - 최종 수집된 고화질 이미지: {total_saved_raw}개")
    print(f"   - 원본 저장 위치: {os.path.abspath(raw_dir)}")
    print("-" * 30)
    print(f"2. 전처리 단계:")
    print(f"   - 목표 해상도: 1280x1280 (Letterbox 패딩 적용)")
    print(f"   - 적용 기술: 노이즈 제거(Denoising) & 대비 개선(CLAHE)")
    print(f"   - 전처리 완료 이미지: {total_processed}개")
    print(f"   - 학습용 저장 위치: {os.path.abspath(processed_dir)}")
    print("="*50)
    print("모든 파이프라인 작업이 성공적으로 종료되었습니다.")

if __name__ == "__main__":
    main()
