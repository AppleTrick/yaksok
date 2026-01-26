"""
이미지 전처리 유틸리티 모듈

이 모듈은 다양한 해상도의 이미지를 AI 모델 분석에 적합하게 전처리하는 함수들을 제공합니다.
- EXIF 회전 정보 처리 (스마트폰 사진 대응)
- 적응형 리사이징 (너무 큰 이미지 축소, 너무 작은 이미지 확대)
- PIL ↔ OpenCV 변환 유틸리티
"""

import numpy as np
import cv2
import io
from PIL import Image, ImageOps


def load_image_with_exif(image_bytes: bytes) -> Image.Image:
    """
    이미지 바이트를 PIL Image로 로드하고 EXIF 회전 정보를 적용합니다.
    
    스마트폰으로 촬영한 이미지는 EXIF 메타데이터에 회전 정보가 저장되어 있어,
    단순 로드 시 이미지가 회전된 상태로 보일 수 있습니다.
    이 함수는 해당 문제를 해결합니다.
    
    Args:
        image_bytes: 원본 이미지 바이트 데이터
        
    Returns:
        EXIF 회전이 적용된 PIL Image 객체
    """
    image = Image.open(io.BytesIO(image_bytes))
    
    # EXIF 정보에 따라 이미지 회전 처리
    try:
        image = ImageOps.exif_transpose(image)
        print("[전처리] EXIF 회전 정보 적용 완료")
    except Exception as e:
        print(f"[전처리] EXIF 처리 중 오류 (무시됨): {e}")
    
    # RGB로 변환 (RGBA나 다른 모드인 경우 대비)
    if image.mode != 'RGB':
        image = image.convert('RGB')
        print(f"[전처리] 이미지 모드를 RGB로 변환")
    
    return image


def adaptive_resize(image: Image.Image, max_size: int = 1000) -> tuple:
    """
    이미지를 AI 모델 입력에 적합한 크기로 리사이징합니다.
    
    - 큰 이미지 (max_size 초과): max_size로 축소 (메모리 및 처리 속도 최적화)
    - 작은 이미지: 그대로 유지 (확대하면 오히려 인식률 저하)
    
    Args:
        image: PIL Image 객체
        max_size: 최대 크기 (기본값 1000px, 기존 동작과 동일)
        
    Returns:
        (리사이즈된 이미지, 스케일 정보 딕셔너리)
    """
    orig_width, orig_height = image.size
    max_dim = max(orig_width, orig_height)
    
    scale_info = {
        "original_size": {"width": orig_width, "height": orig_height},
        "resized": False,
        "scale_x": 1.0,
        "scale_y": 1.0
    }
    
    new_image = image.copy()
    
    # 이미지가 max_size보다 큰 경우에만 축소
    if max_dim > max_size:
        # thumbnail은 비율을 유지하면서 주어진 크기 안에 맞춤
        new_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        scale_info["resized"] = True
        scale_info["resize_type"] = "downscale"
        print(f"[전처리] 이미지 축소: {orig_width}x{orig_height} → {new_image.size[0]}x{new_image.size[1]}")
    else:
        # 작은 이미지는 그대로 유지 (확대 X)
        print(f"[전처리] 이미지 크기 유지: {orig_width}x{orig_height}")
    
    # 스케일 비율 계산 (원본 좌표 복구용)
    new_width, new_height = new_image.size
    scale_info["processed_size"] = {"width": new_width, "height": new_height}
    scale_info["scale_x"] = orig_width / new_width
    scale_info["scale_y"] = orig_height / new_height
    
    return new_image, scale_info


def pil_to_cv2(pil_image: Image.Image) -> np.ndarray:
    """
    PIL Image를 OpenCV numpy 배열로 변환합니다.
    
    PIL은 RGB 순서, OpenCV는 BGR 순서를 사용하므로 채널 변환이 필요합니다.
    """
    rgb_array = np.array(pil_image)
    bgr_array = cv2.cvtColor(rgb_array, cv2.COLOR_RGB2BGR)
    return bgr_array


def cv2_to_pil(cv2_image: np.ndarray) -> Image.Image:
    """
    OpenCV numpy 배열을 PIL Image로 변환합니다.
    """
    rgb_array = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB)
    return Image.fromarray(rgb_array)


def preprocess_image(image_bytes: bytes) -> tuple:
    """
    이미지 바이트를 받아 AI 분석에 적합하게 전처리합니다.
    
    전처리 단계:
    1. EXIF 회전 정보 적용
    2. 적응형 리사이징
    3. PIL 및 OpenCV 형식 모두 반환
    
    Args:
        image_bytes: 원본 이미지 바이트 데이터
        
    Returns:
        (PIL Image, OpenCV ndarray, 스케일 정보 딕셔너리)
    """
    # 1단계: EXIF 회전 적용하여 로드
    pil_image = load_image_with_exif(image_bytes)
    
    # 2단계: 적응형 리사이징
    pil_image, scale_info = adaptive_resize(pil_image)
    
    # 3단계: OpenCV 형식으로 변환
    cv2_image = pil_to_cv2(pil_image)
    
    return pil_image, cv2_image, scale_info


# 하위 호환성을 위한 기존 함수 유지 (main.py에서 사용 중)
def resize_image_for_analysis(image_bytes: bytes) -> np.ndarray:
    """
    기존 호환성을 위한 래퍼 함수.
    새 코드에서는 preprocess_image() 사용을 권장합니다.
    """
    _, cv2_image, _ = preprocess_image(image_bytes)
    return cv2_image
