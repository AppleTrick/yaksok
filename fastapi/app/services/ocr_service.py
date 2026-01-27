"""
OCR 텍스트 추출 서비스 (Rotation Retry + Clean Version)

[핵심 전략]
1. 불필요한 파라미터(show_log, use_dilation) 제거.
2. '풍차돌리기(Rotation Retry)': 원본 -> 90도 회전 -> 270도 회전 순서로 다 읽어보고,
   가장 결과가 좋은(신뢰도 높은) 데이터를 채택함. -> 누워있는 영양제 해결.
3. 이미지 리사이징(640px) 유지.
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
        
        # [옵션 튜닝]
        det_db_thresh=0.3,          
        det_db_box_thresh=0.5,      
        det_db_unclip_ratio=2.5,    # 접착제 강도 2.5 유지
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
    """이미지 리사이징 (640px 기준)"""
    h, w = image.shape[:2]
    max_dim = 640 
    if h > max_dim or w > max_dim:
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
    return image

def parse_ocr_result(result):
    """PaddleOCR 결과(v3 dict/list 혼용)를 표준 리스트로 파싱"""
    parsed_items = []
    if not result: return parsed_items
    
    data = result[0]
    
    # [CASE A] 딕셔너리
    if isinstance(data, dict) and 'rec_texts' in data:
        rec_texts = data.get('rec_texts', [])
        rec_scores = data.get('rec_scores', [])
        rec_polys = data.get('rec_polys', [])
        
        for i in range(len(rec_texts)):
            text = str(rec_texts[i])
            if not text.strip(): continue
            confidence = float(rec_scores[i]) if i < len(rec_scores) else 0.99
            
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

    # [CASE B] 리스트
    elif isinstance(data, list):
        for line in data:
            try:
                if len(line) < 2: continue
                coords = line[0]
                text_info = line[1]
                text = str(text_info[0])
                if not text.strip(): continue
                confidence = float(text_info[1])
                
                height = 10
                if coords:
                    ys = [point[1] for point in coords]
                    height = max(ys) - min(ys)
                
                parsed_items.append({"text": text, "confidence": confidence, "height": height, "box": coords})
            except: continue
            
    return parsed_items

def extract_text(cv2_image: np.ndarray, save_image: bool = False) -> dict:
    if ocr_model is None:
        return {"texts": [], "error": "PaddleOCR 모델이 로드되지 않았습니다"}
    
    try:
        # 1. 기본 전처리 (리사이징)
        base_image = preprocess_image(cv2_image)
        
        candidates = [] # (점수, 결과리스트, 이미지경로) 저장
        
        # 2. 회전 로직 (0도, 90도, 270도 시도)
        rotations = [
            (0, base_image, "original"),
            (90, cv2.rotate(base_image, cv2.ROTATE_90_CLOCKWISE), "rot90"),
            (270, cv2.rotate(base_image, cv2.ROTATE_90_COUNTERCLOCKWISE), "rot270")
        ]
        
        print("[OCR] 🔄 최적의 방향 탐색 시작...")
        
        for angle, img, label in rotations:
            # OCR 실행
            result = ocr_model.ocr(img)
            parsed = parse_ocr_result(result)
            
            # 점수 계산: (글자 수 * 평균 신뢰도) -> 글자가 많고 선명할수록 점수 높음
            if len(parsed) > 0:
                avg_conf = sum([item['confidence'] for item in parsed]) / len(parsed)
                # 너무 짧은 글자(1~2자)만 있는 건 노이즈일 확률 높음 -> 가중치 낮춤
                score = len(parsed) * avg_conf
            else:
                score = 0
            
            candidates.append({
                "angle": angle,
                "score": score,
                "data": parsed,
                "image": img
            })
            # print(f" - [각도 {angle}도] 검출: {len(parsed)}개, 점수: {score:.2f}")

        # 3. 최적의 결과 선택
        # 점수가 가장 높은 후보 선택
        best_candidate = max(candidates, key=lambda x: x['score'])
        
        texts = best_candidate['data']
        # print(f"[OCR] 🏆 최종 선택: {best_candidate['angle']}도 회전 데이터 (점수: {best_candidate['score']:.2f})")
        
        # 디버깅 이미지 저장 (최종 선택된 이미지만 저장)
        if save_image:
            from datetime import datetime
            import uuid
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            image_filename = f"ocr_final_{best_candidate['angle']}deg_{timestamp}_{unique_id}.jpg"
            image_path = os.path.join(SAVE_IMAGE_DIR, image_filename)
            cv2.imwrite(image_path, best_candidate['image'])

        # 정렬 및 반환
        texts.sort(key=lambda x: x['height'], reverse=True)
        
        print(f"[OCR] 최종 {len(texts)}개 텍스트 검출됨")
        if len(texts) > 0:
            preview = [t['text'] for t in texts[:5]]
            print(f" - 상위 결과: {preview}")

        return {"texts": texts, "count": len(texts)}
        
    except Exception as e:
        print(f"[OCR] ❌ 처리 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return {"texts": [], "error": str(e)}