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

from dotenv import load_dotenv

# .env 파일 절대 경로 로드
# 현재 파일(vision_service.py) 위치: fastapi/app/services/vision_service.py
# .env 위치: fastapi/.env
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SERVICE_DIR)
FASTAPI_ROOT = os.path.dirname(APP_DIR)
ENV_PATH = os.path.join(FASTAPI_ROOT, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
    print(f"[Vision Service] .env 로드 성공: {ENV_PATH}")
else:
    # 기본 CWD 로드 시도
    load_dotenv()
    print(f"[Vision Service] ⚠️ .env 파일을 찾을 수 없어 기본 설정을 시도합니다: {ENV_PATH}")

# Google Cloud Vision Credential 설정
# 1. 환경 변수에서 경로를 가져오거나 기본 파일명 사용
CREDENTIAL_ENV = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if CREDENTIAL_ENV:
    # 절대 경로가 아니면 FASTAPI_ROOT 기준으로 변환
    if not os.path.isabs(CREDENTIAL_ENV):
        CREDENTIAL_PATH = os.path.normpath(os.path.join(FASTAPI_ROOT, CREDENTIAL_ENV))
    else:
        CREDENTIAL_PATH = CREDENTIAL_ENV
    
    if os.path.exists(CREDENTIAL_PATH):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = CREDENTIAL_PATH
        print(f"[Vision Service] ✅ 인증 키 파일 확인됨: {CREDENTIAL_PATH}")
    else:
        print(f"[Vision Service] ❌ 인증 키 파일을 찾을 수 없습니다: {CREDENTIAL_PATH}")
else:
    print("[Vision Service] ⚠️ GOOGLE_APPLICATION_CREDENTIALS 환경 변수가 설정되지 않았습니다.")

# Google Cloud Vision 클라이언트 초기화
try:
    vision_client = vision.ImageAnnotatorClient()
    if vision_client:
        print("[Vision Service] ✅ Vision API 클라이언트 초기화 성공")
except Exception as e:
    vision_client = None
    # 에러 메시지 상세 출력 (Traceback 포함하여 출력하기 위해 print 대신 f-string 사용)
    print(f"[Vision Service] ❌ Vision API 클라이언트 초기화 실패: {type(e).__name__}: {str(e)}")
    print(f"[Vision Service] 현재 CWD: {os.getcwd()}")
    print(f"[Vision Service] 인증 환경 변수: {os.getenv('GOOGLE_APPLICATION_CREDENTIALS')}")


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
    
    # 4. Box Coordinates (Normalized)
    # [min_x, min_y, max_x, max_y] format for Frontend
    box = [
        min([v.x for v in vertices]),
        min([v.y for v in vertices]),
        max([v.x for v in vertices]),
        max([v.y for v in vertices])
    ]
    
    return {
        "mid": obj_annotation.mid,
        "name": obj_annotation.name,
        "score": obj_annotation.score,
        "product_name": product_name,
        "full_text": text,
        "box": box
    }

def calculate_iou(box1_vertices, box2_vertices) -> float:
    """두 바운딩 박스의 IoU(Intersection over Union)를 계산합니다."""
    # box1 좌표 추출
    x1_coords = [v.x for v in box1_vertices]
    y1_coords = [v.y for v in box1_vertices]
    box1 = [min(x1_coords), min(y1_coords), max(x1_coords), max(y1_coords)]
    
    # box2 좌표 추출
    x2_coords = [v.x for v in box2_vertices]
    y2_coords = [v.y for v in box2_vertices]
    box2 = [min(x2_coords), min(y2_coords), max(x2_coords), max(y2_coords)]
    
    # 교차 영역 계산
    x_left = max(box1[0], box2[0])
    y_top = max(box1[1], box2[1])
    x_right = min(box1[2], box2[2])
    y_bottom = min(box1[3], box2[3])
    
    if x_right < x_left or y_bottom < y_top:
        return 0.0
    
    intersection = (x_right - x_left) * (y_bottom - y_top)
    
    # 각 박스 면적
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    
    # Union
    union = area1 + area2 - intersection
    
    return intersection / union if union > 0 else 0.0

def deduplicate_objects(objects, iou_threshold=0.5):
    """
    겹치는 객체를 제거합니다 (NMS와 유사).
    같은 영역에 여러 클래스로 탐지된 경우, score가 높은 것만 남깁니다.
    """
    if not objects:
        return []
    
    # score 기준 내림차순 정렬
    sorted_objects = sorted(objects, key=lambda x: x.score, reverse=True)
    kept = []
    
    for obj in sorted_objects:
        should_keep = True
        for kept_obj in kept:
            iou = calculate_iou(
                obj.bounding_poly.normalized_vertices,
                kept_obj.bounding_poly.normalized_vertices
            )
            if iou > iou_threshold:
                # 이미 더 높은 score의 객체가 선택됨
                should_keep = False
                print(f"   => 중복 제거: {obj.name} (IoU={iou:.2f}와 {kept_obj.name} 겹침)")
                break
        if should_keep:
            kept.append(obj)
    
    return kept

def analyze_logic(image_content: bytes) -> List[Dict[str, Any]]:
    """
    실제 분석 로직 (동기 함수).
    """
    if vision_client is None:
        raise RuntimeError("Vision API Client가 초기화되지 않아 분석을 수행할 수 없습니다.")

    # 1. 이미지 로드 및 EXIF 정규화
    try:
        pil_image = Image.open(io.BytesIO(image_content))
        
        # EXIF orientation 적용하여 이미지 정규화
        # 이렇게 하면 Vision API와 프론트엔드가 동일한 방향의 이미지를 사용
        from PIL import ImageOps
        pil_image = ImageOps.exif_transpose(pil_image)
        print(f"[Vision Service] EXIF 정규화 완료: {pil_image.size}")
        
    except Exception as e:
        raise ValueError(f"Invalid image format: {e}")
        
    width, height = pil_image.size
    
    # 2. 정규화된 이미지를 바이트로 재인코딩 (Vision API 전송용)
    normalized_buffer = io.BytesIO()
    pil_image.save(normalized_buffer, format='JPEG', quality=95)
    normalized_content = normalized_buffer.getvalue()
    print(f"[Vision Service] 정규화된 이미지 크기: {len(normalized_content)} bytes")

    # 3. Object Localization (정규화된 이미지로 호출)
    image = vision.Image(content=normalized_content)
    print(f"[Vision Service] Object Localization API 호출 중...")
    objects = vision_client.object_localization(image=image).localized_object_annotations
    print(f"[Vision Service] ✅ 객체 탐지 응답 수신 완료")
    
    print(f"[Vision Service] 탐지된 전체 객체 수: {len(objects)}")
    for obj in objects:
        print(f" - 탐지됨: {obj.name} (Score: {obj.score:.2f})")
    
    # 4. 타겟 클래스 필터링
    target_objects = [obj for obj in objects if obj.name in TARGET_CLASSES]
    print(f"[Vision Service] 타겟 클래스 필터링 후: {len(target_objects)}개")
    
    # 5. 중복 객체 제거 (IoU 기반)
    deduplicated_objects = deduplicate_objects(target_objects, iou_threshold=0.3)
    print(f"[Vision Service] 중복 제거 후: {len(deduplicated_objects)}개")
    
    results = []
    
    # 6. Filter & Process
    for obj in deduplicated_objects:
        print(f"   => 처리 시작: {obj.name} (Score: {obj.score:.2f})")
        result = process_single_object(pil_image, obj, width, height)
        if result:
            results.append(result)
    
    if not results:
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
