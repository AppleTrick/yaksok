"""
OCR 텍스트 추출 서비스 (Final Optimized Version)

[최적화 완료]
1. 코드 구조 리팩토링: 중복 제거 및 가독성 향상
2. 방어 로직 강화: 잘못된 이미지 입력 시 조기 리턴
3. 로직 유지: 
   - 스마트 리사이징 (Upscale/Downscale)
   - 3방향 회전 탐색 (Rotation Retry)
   - 접착제 옵션 (Unclip Ratio 2.5)
"""

import os
import numpy as np
import cv2
from paddleocr import PaddleOCR

# ============================================================
# OCR 모델 초기화
# ============================================================

print("[OCR 서비스] PaddleOCR 모델 로딩 중...")
try:
    ocr_model = PaddleOCR(
        lang='korean',              
        use_angle_cls=True,         
        enable_mkldnn=False,        
        ocr_version='PP-OCRv3',
        det_db_thresh=0.3,          
        det_db_box_thresh=0.5,      
        det_db_unclip_ratio=2.5
    
    )
    print("[OCR 서비스] ✅ PaddleOCR 모델 로드 완료")
except Exception as e:
    print(f"[OCR 서비스] ❌ PaddleOCR 모델 로드 실패: {e}")
    ocr_model = None

# ============================================================
# SaveImage 폴더 설정
# ============================================================
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVE_IMAGE_DIR = os.path.join(APP_DIR, "SaveImage")
os.makedirs(SAVE_IMAGE_DIR, exist_ok=True)


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    이미지 크기에 따른 자동 보정 (돋보기 & 망원경)
    """
    if image is None: return None
    h, w = image.shape[:2]
    
    # 1. 이미지가 너무 작을 때 (Upscaling) - 작은 글씨 뭉개짐 방지
    if h < 600 or w < 600:
        scale = 2.0
        if h < 300 or w < 300: 
            scale = 3.0
            
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    # 2. 이미지가 너무 클 때 (Downscaling) - 거대 로고 인식 불가 방지
    elif h > 960 or w > 960:
        max_dim = 960
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
    return image

def parse_ocr_result(result):
    """PaddleOCR 결과 표준화 파싱 (중복 로직 통합)"""
    parsed_items = []
    if not result or result[0] is None: 
        return parsed_items
    
    data = result[0]
    
    # 데이터 포맷 정규화 (Dict -> List 변환하여 로직 통일)
    # PaddleOCR 버전에 따라 결과가 Dict 또는 List로 옴
    rows = []
    if isinstance(data, dict) and 'rec_texts' in data:
        rec_texts = data.get('rec_texts', [])
        rec_scores = data.get('rec_scores', [])
        rec_polys = data.get('rec_polys', [])
        for i in range(len(rec_texts)):
            # Dict 포맷을 List 포맷처럼 (coords, (text, score)) 튜플로 변환
            rows.append((rec_polys[i] if i < len(rec_polys) else [], (rec_texts[i], rec_scores[i] if i < len(rec_scores) else 0.99)))
    elif isinstance(data, list):
        rows = data

    # 통합 파싱 로직
    for line in rows:
        try:
            if len(line) < 2: continue
            
            coords = line[0]
            if isinstance(coords, np.ndarray): coords = coords.tolist()
            
            text_info = line[1]
            if isinstance(text_info, tuple) and len(text_info) >= 2:
                text, confidence = text_info[0], text_info[1]
            elif isinstance(text_info, str):
                text, confidence = text_info, 0.99
            else:
                continue
                
            if text and len(text.strip()) > 0:
                # 40% 미만 신뢰도 결과 필터링
                if float(confidence) < 0.4:
                    continue
                    
                parsed_items.append({
                    "text": text.strip(),
                    "confidence": float(confidence),
                    "coords": coords
                })
        except Exception:
            continue
    
    return parsed_items


def extract_text(image: np.ndarray, rotations: list = [0, 90, 270], save_image: bool = False) -> dict:
    """
    이미지에서 텍스트를 추출합니다. (회전 탐색 포함)
    
    Args:
        image: OpenCV 이미지 (BGR 또는 RGB)
        rotations: 시도할 회전 각도 목록
        
    Returns:
        dict: {
            "text": str,           # 추출된 전체 텍스트
            "items": list,         # 개별 텍스트 항목들
            "confidence": float    # 평균 신뢰도
        }
    """
    # 방어 로직: 모델 없거나 이미지 없으면 조기 리턴
    if ocr_model is None:
        return {"text": "", "items": [], "texts": [], "count": 0, "confidence": 0.0, "error": "OCR 모델 로드 실패"}
    
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        return {"text": "", "items": [], "texts": [], "count": 0, "confidence": 0.0, "error": "유효하지 않은 이미지"}
    
    # 이미지 전처리
    processed = preprocess_image(image)
    if processed is None:
        return {"text": "", "items": [], "texts": [], "count": 0, "confidence": 0.0, "error": "이미지 전처리 실패"}
    
    # 디버깅용 이미지 저장
    if save_image:
        try:
            import time
            timestamp = int(time.time() * 1000)
            save_path = os.path.join(SAVE_IMAGE_DIR, f"ocr_input_{timestamp}.jpg")
            cv2.imwrite(save_path, processed)
            print(f"[OCR] 이미지 저장됨: {save_path}")
        except Exception as e:
            print(f"[OCR] 이미지 저장 실패: {e}")
    
    best_result = {"text": "", "items": [], "texts": [], "count": 0, "confidence": 0.0}
    
    # 회전 탐색
    for angle in rotations:
        try:
            if angle == 0:
                rotated = processed
            elif angle == 90:
                rotated = cv2.rotate(processed, cv2.ROTATE_90_CLOCKWISE)
            elif angle == 180:
                rotated = cv2.rotate(processed, cv2.ROTATE_180)
            elif angle == 270:
                rotated = cv2.rotate(processed, cv2.ROTATE_90_COUNTERCLOCKWISE)
            else:
                continue
            
            # PaddleOCR 호출 (cls 파라미터 없이)
            result = ocr_model.ocr(rotated)
            items = parse_ocr_result(result)
            
            if items:
                total_conf = sum(item["confidence"] for item in items)
                avg_conf = total_conf / len(items)
                
                if avg_conf > best_result["confidence"]:
                    best_result = {
                        "text": " ".join(item["text"] for item in items),
                        "items": items,
                        "texts": items,  # analysis_service.py 호환용
                        "count": len(items),  # /test 페이지 호환용
                        "confidence": avg_conf,
                        "rotation": angle
                    }
        except Exception as e:
            print(f"[OCR] 회전 {angle}도 처리 중 오류: {e}")
            continue
    
    return best_result