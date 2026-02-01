"""
Google Cloud Vision API 서비스
이미지 내 영양제 개체 인식 및 제품명 추출을 담당합니다.
"""

import os

# [CRITICAL Fix] macOS/gRPC DNS Error 해결
# 반드시 google.cloud import 이전에 설정해야 합니다.
os.environ["GRPC_DNS_RESOLVER"] = "native"

import io
import asyncio
from typing import List, Dict, Any
from google.cloud import vision
from PIL import Image

# Google Cloud Vision Credential 설정
# 프로젝트 루트의 JSON 키 파일을 자동으로 찾아서 환경 변수로 설정
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CREDENTIAL_FILE = "ijip-naejip-9ebfced39702.json"
CREDENTIAL_PATH = os.path.join(BASE_DIR, CREDENTIAL_FILE)

if os.path.exists(CREDENTIAL_PATH) and "GOOGLE_APPLICATION_CREDENTIALS" not in os.environ:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIAL_PATH
    print(f"[Vision Service] 감지된 키 파일로 인증 설정: {CREDENTIAL_PATH}")

# Google Cloud Vision 클라이언트 초기화
try:
    vision_client = vision.ImageAnnotatorClient()
    print("[Vision Service] ✅ Vision API 클라이언트 초기화 성공")
except Exception as e:
    vision_client = None
    print(f"[Vision Service] ❌ Vision API 클라이언트 초기화 실패: {e}")


# 탐지할 영양제 관련 객체 클래스 목록
# Google Cloud Vision Object Localization 모델이 반환하는 클래스명 기준
TARGET_CLASSES = [
    "Bottle", 
    "Container", 
    "Packaged goods", 
    "Bottled and jarred packaged goods",
    "Box",
    "Medicine",
    "Pill"
]

def get_vision_client():
    """Vision API 클라이언트 반환 (싱글톤 패턴과 유사하게 사용)"""
    return vision_client

def crop_image(pil_image: Image.Image, vertices, width: int, height: int) -> Image.Image:
    """
    normalized_vertices를 사용하여 이미지를 Crop합니다.
    """
    # 좌표 변환: normalized -> pixel
    # vertices[0]: 좌상단, vertices[2]: 우하단 (일반적인 경우)
    # 하지만 회전된 객체일 수 있으므로 min/max를 구함
    
    x_coords = [v.x * width for v in vertices]
    y_coords = [v.y * height for v in vertices]
    
    left = max(0, min(x_coords))
    top = max(0, min(y_coords))
    right = min(width, max(x_coords))
    bottom = min(height, max(y_coords))
    
    # Crop 수행
    return pil_image.crop((left, top, right, bottom))

def extract_candidate_name(text_annotations) -> str:
    """
    OCR 결과에서 경험적(Heuristic) 방법으로 제품명을 추출합니다.
    조건:
    1. 폰트 크기(Bounding Box 높이)가 큰 텍스트
    2. 상단에 위치한 텍스트
    를 우선순위로 고려하여 선정.
    """
    if not text_annotations:
        return ""

    # text_annotations[0]은 전체 텍스트이므로 제외하고 개별 단어/라인 분석
    # 하지만 Google Vision API document_text_detection은 full_text_annotation도 제공하지만
    # 여기서는 text_annotations 리스트를 활용 (0번 인덱스는 전체 요약)
    
    candidates = text_annotations[1:]
    if not candidates:
        return text_annotations[0].description if text_annotations else ""

    # 휴리스틱: 높이가 큰 순서대로 정렬 (폰트 크기 추정)
    # 각 annotation의 bounding_poly를 사용하여 높이 계산
    def get_height(annotation):
        vertices = annotation.bounding_poly.vertices
        y_coords = [v.y for v in vertices]
        return max(y_coords) - min(y_coords)

    # 높이 기준 내림차순 정렬
    sorted_candidates = sorted(candidates, key=get_height, reverse=True)
    
    # 상위 3개 중에서 가장 위에 있는(y좌표가 작은) 것을 선택하거나, 그냥 가장 큰 것을 선택
    # 여기서는 가장 큰 것이 제품명일 확률이 높으므로 가장 큰 것을 선택하되, 
    # 너무 짧은 문자열(숫자 등)은 제외하는 로직을 추가할 수 있음.
    
    # 단순화: 가장 높이가 큰 텍스트 덩어리들을 결합해서 반환하거나,
    # 라인 단위 추론이 필요하지만, 여기서는 단순하게 가장 큰 텍스트 뭉치를 후보로 반환.
    
    # 시도 1: 가장 큰 글자 반환
    if sorted_candidates:
         best_candidate = sorted_candidates[0]
         return best_candidate.description
    
    return ""

def process_single_object(pil_image: Image.Image, obj_annotation, width: int, height: int) -> Dict[str, Any]:
    """
    단일 객체에 대해 Crop 및 OCR을 수행합니다.
    """
    if vision_client is None:
        raise RuntimeError("Vision API 클라이언트가 초기화되지 않았습니다.")
        
    # 1. Crop
    vertices = obj_annotation.bounding_poly.normalized_vertices
    try:
        cropped_image = crop_image(pil_image, vertices, width, height)
    except Exception as e:
        print(f"[Error] Cropping failed: {e}")
        return None

    # 2. OCR (Document Text Detection)
    # 이미지를 바이트로 변환
    img_byte_arr = io.BytesIO()
    cropped_image.save(img_byte_arr, format=pil_image.format or 'JPEG')
    content = img_byte_arr.getvalue()
    
    image = vision.Image(content=content)
    
    # 개별 OCR 수행
    response = vision_client.document_text_detection(image=image)
    text = response.full_text_annotation.text
    text_annotations = response.text_annotations # 리스트 형태
    
    # 3. Heuristic Extraction
    product_name = extract_candidate_name(text_annotations)
    
    return {
        "mid": obj_annotation.mid,
        "name": obj_annotation.name,
        "score": obj_annotation.score,
        "product_name": product_name,
        "full_text": text
    }

def analyze_logic(image_content: bytes) -> List[Dict[str, Any]]:
    """
    실제 분석 로직 (동기 함수).
    """
    if vision_client is None:
        raise RuntimeError("Vision API Client가 초기화되지 않아 분석을 수행할 수 없습니다.")

    # 1. 이미지 로드 및 정보 획득
    try:
        pil_image = Image.open(io.BytesIO(image_content))
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")
        
    width, height = pil_image.size
    

    # 2. Object Localization
    image = vision.Image(content=image_content)
    objects = vision_client.object_localization(image=image).localized_object_annotations
    
    print(f"[Vision Service] 탐지된 전체 객체 수: {len(objects)}")
    for obj in objects:
        print(f" - 탐지됨: {obj.name} (Score: {obj.score:.2f})")
    
    results = []
    
    # 3. Filter & Process
    found_target = False
    for obj in objects:
        if obj.name in TARGET_CLASSES:
            found_target = True
            print(f"   => 타겟 매칭 성공! 처리 시작: {obj.name}")
            # 각 객체별 처리 (Crop -> OCR -> Extract)
            result = process_single_object(pil_image, obj, width, height)
            if result:
                results.append(result)
    
    if not results and not found_target:
        print("[Vision Service] 지정된 타겟(Bottle, Container 등)이 감지되지 않았습니다.")
                
    return results

async def analyze_with_vision_api(image_content: bytes) -> List[Dict[str, Any]]:
    """
    비동기 래퍼 함수.
    Google Vision API 호출과 이미지 처리는 CPU/IO 바운드 작업이므로
    스레드풀에서 실행하여 이벤트 루프 차단을 방지합니다.
    """
    loop = asyncio.get_event_loop()
    # 동기 함수인 analyze_logic을 스레드풀에서 실행
    try:
        result = await loop.run_in_executor(None, analyze_logic, image_content)
        return result
    except Exception as e:
        print(f"[Vision Service Error] {e}")
        raise e
