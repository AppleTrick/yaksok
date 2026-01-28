"""
OCR 텍스트 추출 서비스 (Universal Size Adaption)

[최종 수정 사항]
1. 이미지 크기 자동 보정 로직 강화 (preprocess_image)
   - 너무 작은 이미지(<400px): 2~3배 확대 (Upscaling) -> 작은 글씨 깨짐 방지
   - 너무 큰 이미지(>960px): 축소 (Downscaling) -> 거대 로고 인식 불가 방지
2. PP-OCRv3 + 회전 로직 + 접착제 옵션 유지
"""

import os
import numpy as np
import cv2
from paddleocr import PaddleOCR
import copy

# ============================================================
# OCR 모델 초기화
# ============================================================

print("[OCR 서비스] PaddleOCR 모델 로딩 중...")
try:
    ocr_model = PaddleOCR(
        lang='korean',              
        use_angle_cls=True,         
        enable_mkldnn=False,        
        ocr_version='PP-OCRv3',     # 한국어 최강 v3
        
        # [옵션 튜닝]
        det_db_thresh=0.3,          
        det_db_box_thresh=0.5,      
        det_db_unclip_ratio=2.5,    # 접착제 강도
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
    h, w = image.shape[:2]
    
    # 1. 이미지가 너무 작을 때 (Upscaling) - 너의 이번 케이스
    # 최소 600px 정도는 확보해야 글자가 뭉개지지 않음
    if h < 600 or w < 600:
        scale = 2.0
        if h < 300 or w < 300: # 진짜 너무 작으면 3배 뻥튀기
            scale = 3.0
            
        new_w = int(w * scale)
        new_h = int(h * scale)
        # CUBIC 보간법이 확대할 때 깨짐을 좀 막아줌
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
        # print(f"[OCR] 돋보기 작동: {w}x{h} -> {new_w}x{new_h}")

    # 2. 이미지가 너무 클 때 (Downscaling) - 아까 센트룸 케이스
    # 960px 넘어가면 줄임
    elif h > 960 or w > 960:
        max_dim = 960
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        # print(f"[OCR] 축소 작동: {w}x{h} -> {new_w}x{new_h}")
        
    return image

def parse_ocr_result(result):
    """PaddleOCR 결과 표준화 파싱"""
    parsed_items = []
    if not result: return parsed_items
    
    data = result[0]
    
    if isinstance(data, dict) and 'rec_texts' in data:
        rec_texts = data.get('rec_texts', [])
        rec_scores = data.get('rec_scores', [])
        rec_polys = data.get('rec_polys', [])
        
        for i in range(len(rec_texts)):
            text = str(rec_texts[i])
            if not text.strip(): continue
            confidence = float(rec_scores[i]) if i < len(rec_scores) else 0.99
            
            # [수정] 신뢰도(confidence) 0.5 미만은 제외
            if confidence < 0.5: continue
            
            coords = None
            height = 10
            if i < len(rec_polys):
                poly = rec_polys[i]
                if isinstance(poly, np.ndarray): poly = poly.tolist()
                coords = poly
                try:
                    ys = [point[1] for point in coords]
                    height = max(ys) - min(ys)
                except: pass
            
            parsed_items.append({"text": text, "confidence": confidence, "height": height, "box": coords})

    elif isinstance(data, list):
        for line in data:
            try:
                if len(line) < 2: continue
                coords = line[0]
                text_info = line[1]
                text = str(text_info[0])
                if not text.strip(): continue
                confidence = float(text_info[1])
                
                # [수정] 신뢰도(confidence) 0.5 미만은 제외
                if confidence < 0.5: continue
                
                height = 10
                if coords:
                    ys = [point[1] for point in coords]
                    height = max(ys) - min(ys)
                
                parsed_items.append({"text": text, "confidence": confidence, "height": height, "box": coords})
            except: continue
            
    return parsed_items

def extract_text(cv2_image: np.ndarray, save_image: bool = False) -> dict:
    print(f"[OCR] 텍스트 추출 시작 (입력 이미지 크기: {cv2_image.shape})")
    if ocr_model is None:
        return {"texts": [], "error": "PaddleOCR 모델이 로드되지 않았습니다"}
    
    try:
        # 1. 지능형 전처리 (확대/축소)
        base_image = preprocess_image(cv2_image)
        
        candidates = []
        
        # 2. 회전 로직
        rotations = [
            (0, base_image),
            (90, cv2.rotate(base_image, cv2.ROTATE_90_CLOCKWISE)),
            (270, cv2.rotate(base_image, cv2.ROTATE_90_COUNTERCLOCKWISE))
        ]
        
        for angle, img in rotations:
            result = ocr_model.ocr(img)
            parsed = parse_ocr_result(result)
            
            if len(parsed) > 0:
                avg_conf = sum([item['confidence'] for item in parsed]) / len(parsed)
                score = len(parsed) * avg_conf
            else:
                score = 0
            
            candidates.append({
                "angle": angle,
                "score": score,
                "data": parsed,
                "image": img
            })

        # 3. 최적 결과 선택
        best_candidate = max(candidates, key=lambda x: x['score'])
        texts = best_candidate['data']
        
        if save_image:
            from datetime import datetime
            import uuid
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            image_filename = f"ocr_universal_{best_candidate['angle']}deg_{timestamp}_{unique_id}.jpg"
            image_path = os.path.join(SAVE_IMAGE_DIR, image_filename)
            cv2.imwrite(image_path, best_candidate['image'])

        texts.sort(key=lambda x: x['height'], reverse=True)
        
        print(f"[OCR] 최종 {len(texts)}개 텍스트 검출됨 (v3, {best_candidate['angle']}도)")
        if len(texts) > 0:
            preview = [t['text'] for t in texts[:5]]
            print(f" - 상위 결과: {preview}")

        return {"texts": texts, "count": len(texts)}
        
    except Exception as e:
        print(f"[OCR] ❌ 처리 중 오류 발생: {e}")
        return {"texts": [], "error": str(e)}