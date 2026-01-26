"""
OCR 텍스트 추출 서비스 (EasyOCR 기반)

이미지에서 텍스트를 추출하는 OCR 서비스입니다.
EasyOCR은 PyTorch 기반이라 YOLO와 동일 프로세스에서 실행 가능합니다.
(PaddleOCR과 달리 DLL 충돌 없음)
"""

import os
import numpy as np
import cv2
import easyocr

# ============================================================
# OCR 모델 초기화
# ============================================================

# EasyOCR 리더 초기화 (한국어 + 영어)
# GPU 사용 가능하면 자동 사용
print("[OCR 서비스] EasyOCR 모델 로딩 중...")
try:
    reader = easyocr.Reader(['ko', 'en'], gpu=False)  # CPU 모드
    print("[OCR 서비스] ✅ EasyOCR 모델 로드 완료 (한국어 + 영어)")
except Exception as e:
    print(f"[OCR 서비스] ❌ EasyOCR 모델 로드 실패: {e}")
    reader = None


# ============================================================
# SaveImage 폴더 설정
# ============================================================

APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVE_IMAGE_DIR = os.path.join(APP_DIR, "SaveImage")
os.makedirs(SAVE_IMAGE_DIR, exist_ok=True)
print(f"[OCR 서비스] SaveImage 디렉토리: {SAVE_IMAGE_DIR}")


# ============================================================
# OCR 실행 함수
# ============================================================

def extract_text(cv2_image: np.ndarray, save_image: bool = False) -> dict:
    """
    이미지에서 텍스트를 추출합니다.
    
    Args:
        cv2_image: OpenCV 형식 이미지 (BGR)
        save_image: 이미지 저장 여부 (기본 False)
        
    Returns:
        OCR 결과 {texts, count} 또는 {texts, error}
    """
    print(f"\n[OCR] === EasyOCR 텍스트 추출 시작 ===")
    
    if reader is None:
        return {"texts": [], "error": "EasyOCR 모델이 로드되지 않았습니다"}
    
    try:
        # BGR → RGB 변환 (EasyOCR은 RGB 입력)
        rgb_image = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2RGB)
        
        print(f"[OCR] 이미지 크기: {rgb_image.shape[1]}x{rgb_image.shape[0]}")
        
        # 이미지 저장 (옵션)
        image_path = None
        if save_image:
            from datetime import datetime
            import uuid
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            unique_id = str(uuid.uuid4())[:8]
            image_filename = f"ocr_{timestamp}_{unique_id}.jpg"
            image_path = os.path.join(SAVE_IMAGE_DIR, image_filename)
            cv2.imwrite(image_path, cv2_image, [cv2.IMWRITE_JPEG_QUALITY, 95])
            print(f"[OCR] 이미지 저장: {image_path}")
        
        # OCR 실행
        result = reader.readtext(rgb_image)
        
        texts = []
        for detection in result:
            # detection[0] (box)는 [[x,y], [x,y], [x,y], [x,y]] 형태
            # 각 좌표값을 Python 기본 float으로 변환 (Numpy 타입은 JSON 직렬화 불가)
            raw_box = detection[0]
            box = [[float(val) for val in point] for point in raw_box]
            
            text = detection[1]
            confidence = float(detection[2])
            
            texts.append({
                "text": text,
                "confidence": round(confidence, 2),
                "box": box
            })
            print(f"[OCR] 📝 '{text}' (신뢰도: {confidence:.0%})")
        
        print(f"[OCR] 추출된 텍스트 수: {len(texts)}")
        print(f"[OCR] === 텍스트 추출 완료 ===\n")
        
        result_dict = {
            "texts": texts,
            "count": len(texts)
        }
        
        if image_path:
            result_dict["image_path"] = image_path
        
        return result_dict
        
    except Exception as e:
        print(f"[OCR] ❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return {"texts": [], "error": str(e)}
