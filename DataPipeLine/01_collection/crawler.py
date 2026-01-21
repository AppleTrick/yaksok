import os
import time
import requests
import io
import re
import json
from PIL import Image
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager

class SupplementCrawler:
    def __init__(self, download_path='data/raw', min_resolution=(1280, 1280), min_filesize=200 * 1024):
        """
        초기화 함수
        :param download_path: 이미지가 저장될 기본 경로
        :param min_resolution: 최소 해상도 (가로, 세로)
        :param min_filesize: 최소 파일 크기 (바이트 단위)
        """
        self.download_path = download_path
        self.min_resolution = min_resolution
        self.min_filesize = min_filesize
        # 제외할 키워드 목록
        self.exclude_keywords = ['음료', '생수', 'beverage', 'water', 'drink', 'juice', 'coffee', 'soda', '콜라', '사이다']
        
        # Chrome 옵션 설정
        self.chrome_options = Options()
        self.chrome_options.add_argument("--headless=new")  # 새로운 headless 모드
        self.chrome_options.add_argument("--no-sandbox")
        self.chrome_options.add_argument("--disable-dev-shm-usage")
        self.chrome_options.add_argument("--disable-gpu")
        self.chrome_options.add_argument("--window-size=1920,1080")
        self.chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        self.chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        self.chrome_options.add_experimental_option('useAutomationExtension', False)
        self.chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        
        self.driver = None
        self.collected_urls = set()  # 중복 URL 방지

    def start_driver(self):
        """Webdriver(크롬 브라우저) 실행"""
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=self.chrome_options)
        # 자동화 감지 우회
        self.driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """
        })

    def close_driver(self):
        """브라우저 종료"""
        if self.driver:
            self.driver.quit()

    def is_excluded(self, text):
        """텍스트에 제외 키워드가 포함되어 있는지 확인"""
        if not text:
            return False
        return any(keyword in text.lower() for keyword in self.exclude_keywords)

    def download_image(self, url, folder, filename):
        """
        URL로부터 이미지를 다운로드하고 조건(해상도, 크기)을 확인하여 저장
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': 'https://www.google.com/'
            }
            response = requests.get(url, timeout=15, headers=headers)
            if response.status_code == 200:
                content = response.content
                
                # Pillow를 이용해 이미지 열기 및 정보 확인
                image = Image.open(io.BytesIO(content))
                width, height = image.size
                
                # 고화질 조건 필터링: 해상도 기준 충족 OR 파일 크기 기준 충족
                if (width >= self.min_resolution[0] and height >= self.min_resolution[1]) or len(content) >= self.min_filesize:
                    os.makedirs(folder, exist_ok=True)
                    
                    # 이미지 포맷에 맞는 확장자 결정
                    fmt = image.format.lower() if image.format else 'jpeg'
                    ext_map = {'jpeg': 'jpg', 'png': 'png', 'webp': 'webp', 'gif': 'gif'}
                    ext = ext_map.get(fmt, 'jpg')
                    
                    # 파일명에 올바른 확장자 적용
                    base_name = os.path.splitext(filename)[0]
                    final_filename = f"{base_name}.{ext}"
                    
                    filepath = os.path.join(folder, final_filename)
                    with open(filepath, 'wb') as f:
                        f.write(content)
                    return True, width, height, len(content)
        except Exception as e:
            print(f"    [경고] 이미지 다운로드 실패: {str(e)[:60]}")
        return False, 0, 0, 0

    def extract_original_urls_from_page(self):
        """페이지 소스에서 원본 이미지 URL들을 추출"""
        urls = []
        try:
            page_source = self.driver.page_source
            # 구글 이미지 검색 결과에서 원본 URL 패턴 추출
            # 패턴 1: "ou":"https://..." 형태
            pattern1 = r'"ou":"(https?://[^"]+)"'
            matches1 = re.findall(pattern1, page_source)
            urls.extend(matches1)
            
            # 패턴 2: data-src 속성
            pattern2 = r'data-src="(https?://[^"]+)"'
            matches2 = re.findall(pattern2, page_source)
            urls.extend(matches2)
            
            # 패턴 3: ["https://...","...","..."] 형태의 배열에서 첫 번째 URL
            pattern3 = r'\["(https?://[^"]+\.(?:jpg|jpeg|png|webp))",'
            matches3 = re.findall(pattern3, page_source, re.IGNORECASE)
            urls.extend(matches3)
            
        except Exception as e:
            print(f"    [경고] URL 추출 실패: {str(e)[:50]}")
        
        # 중복 제거 및 유효한 이미지 URL만 필터링
        valid_urls = []
        for url in urls:
            if url not in self.collected_urls:
                # 구글 내부 URL 및 인코딩된 URL 제외
                if 'gstatic.com' not in url and 'google.com' not in url and 'encrypted' not in url:
                    valid_urls.append(url)
        
        return valid_urls

    def scroll_and_load_more(self, scroll_count=5):
        """스크롤하여 더 많은 이미지 로드"""
        for i in range(scroll_count):
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1.5)
            
            # "더보기" 버튼 클릭 시도
            try:
                more_btn = self.driver.find_elements(By.CSS_SELECTOR, "input.mye4qd, button.mye4qd")
                if more_btn:
                    more_btn[0].click()
                    time.sleep(2)
            except:
                pass

    def crawl(self, keywords, max_images=100):
        """
        이미지 크롤링 실행 메인 로직
        :param keywords: 검색어 리스트
        :param max_images: 검색어당 수집할 최대 이미지 수
        """
        total_collected = 0
        total_saved = 0

        self.start_driver()
        
        for keyword in keywords:
            print(f"\n[검색 시작] 키워드: {keyword}")
            # 키워드에 '박스'가 포함되면 box 폴더로, 아니면 bottle 폴더로 분류
            folder_type = 'box' if 'box' in keyword.lower() or '박스' in keyword else 'bottle'
            target_folder = os.path.join(self.download_path, folder_type)
            
            # 구글 이미지 검색 URL (고해상도 필터 추가)
            search_url = f"https://www.google.com/search?q={keyword}&tbm=isch&tbs=isz:l"  # isz:l = 대형 이미지만
            self.driver.get(search_url)
            time.sleep(2)
            
            # 더 많은 이미지를 로드하기 위해 스크롤
            self.scroll_and_load_more(scroll_count=5)
            
            # 방법 1: 페이지 소스에서 직접 URL 추출 (더 안정적)
            urls = self.extract_original_urls_from_page()
            print(f"'{keyword}' 검색 결과 약 {len(urls)}개의 후보 URL을 찾았습니다.")
            
            keyword_saved = 0
            for i, url in enumerate(urls):
                if keyword_saved >= max_images:
                    break
                
                # 이미 수집한 URL 스킵
                if url in self.collected_urls:
                    continue
                    
                self.collected_urls.add(url)
                total_collected += 1
                
                # 제외 키워드 체크
                if self.is_excluded(url):
                    continue
                
                filename = f"{keyword.replace(' ', '_')}_{total_collected}"
                success, w, h, size = self.download_image(url, target_folder, filename)
                
                if success:
                    total_saved += 1
                    keyword_saved += 1
                    print(f" - 저장됨: {w}x{h}, {size//1024}KB | {filename}")
            
            # 방법 2: 썸네일 클릭 방식 (방법 1이 충분하지 않을 경우)
            if keyword_saved < max_images:
                try:
                    thumbnails = self.driver.find_elements(By.CSS_SELECTOR, "img.Q4LuWd, img.rg_i, img[data-src]")
                    print(f"  추가 탐색: {len(thumbnails)}개의 썸네일 발견")
                    
                    for thumb in thumbnails:
                        if keyword_saved >= max_images:
                            break
                        
                        try:
                            # 썸네일 클릭
                            self.driver.execute_script("arguments[0].click();", thumb)
                            time.sleep(1)
                            
                            # 원본 이미지 URL 찾기
                            large_imgs = self.driver.find_elements(By.CSS_SELECTOR, 
                                "img.sFlh5c.pT0Scc, img.n3VNCb.pT0Scc, img.r48jcc, img[data-noaft='1']")
                            
                            for img in large_imgs:
                                src = img.get_attribute('src') or img.get_attribute('data-src')
                                if src and src.startswith('http') and 'gstatic' not in src:
                                    if src not in self.collected_urls:
                                        self.collected_urls.add(src)
                                        total_collected += 1
                                        
                                        alt = img.get_attribute('alt') or ""
                                        if not self.is_excluded(alt) and not self.is_excluded(src):
                                            filename = f"{keyword.replace(' ', '_')}_{total_collected}"
                                            success, w, h, size = self.download_image(src, target_folder, filename)
                                            
                                            if success:
                                                total_saved += 1
                                                keyword_saved += 1
                                                print(f" - 저장됨: {w}x{h}, {size//1024}KB | {filename}")
                                                break
                        except Exception as e:
                            continue
                except Exception as e:
                    print(f"    [경고] 썸네일 탐색 실패: {str(e)[:50]}")
            
            print(f"'{keyword}' 키워드에서 {keyword_saved}개 이미지 저장 완료")

        self.close_driver()
        return total_collected, total_saved

if __name__ == "__main__":
    # 개별 테스트용
    test_keywords = ['영양제 통', 'Supplements Box']
    crawler = SupplementCrawler()
    total_found, total_saved = crawler.crawl(test_keywords, max_images=5)
    print(f"\n최종 요약: {total_found}개 감지, {total_saved}개 조건 충족 및 저장")
