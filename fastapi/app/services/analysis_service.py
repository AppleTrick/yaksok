"""
통합 분석 서비스 (오케스트레이터)

YOLO, 바코드, OCR 서비스를 조율하여 영양제 이미지를 종합 분석합니다.

분석 파이프라인:
1. 이미지 전처리 (EXIF 회전, 리사이징)
2. YOLO 객체탐지 (영양제 검출)
3. 바코드 탐지 → DB 조회
4. OCR 텍스트 추출
"""

from PIL import Image
import numpy as np

# 서비스 임포트
from app.services.yolo_service import detect_supplements
from app.services.barcode_service import detect_barcode
from app.services.ocr_service import extract_text
from app.utils import preprocess_image


# ============================================================
# 통합 분석 함수
# ============================================================

def analyze_supplement(image_bytes: bytes) -> dict:
    """
    영양제 이미지를 종합 분석합니다.
    
    분석 순서:
    1. 이미지 전처리 (EXIF 회전, 리사이징)
    2. YOLO 객체탐지 → 영양제가 없으면 종료
    3. 바코드 탐지 → DB에 정보가 있으면 반환
    4. OCR 텍스트 추출
    
    Args:
        image_bytes: 원본 이미지 바이트 데이터
        
    Returns:
        종합 분석 결과 딕셔너리
    """
    print("\n" + "=" * 60)
    print("🔬 영양제 종합 분석 시작")
    print("=" * 60)
    
    try:
        # ===== 1단계: 이미지 전처리 =====
        pil_image, cv2_image, scale_info = preprocess_image(image_bytes)
        
        result = {
            "step": None,
            "success": False,
            "yolo": None,
            "barcode": None,
            "ocr": None,
            "processing_info": scale_info
        }
        
        # ===== 2단계: YOLO 객체탐지 =====
        yolo_result = detect_supplements(pil_image)
        result["yolo"] = yolo_result
        
        if not yolo_result["detected"]:
            result["step"] = "yolo"
            result["message"] = "이미지에서 영양제를 찾지 못했습니다"
            print("⚠️ 영양제 미탐지 - 분석 종료")
            return result
        
        # ===== 3단계: 바코드 탐지 =====
        barcode_result = detect_barcode(cv2_image)
        result["barcode"] = barcode_result
        
        if barcode_result["found"] and barcode_result.get("db_result"):
            # DB에서 제품 정보를 찾은 경우
            result["step"] = "barcode"
            result["success"] = True
            result["message"] = "바코드로 제품 정보를 찾았습니다"
            print("✅ 바코드 DB 조회 성공 - 분석 완료")
            return result
        
        # ===== 4단계: OCR 텍스트 추출 =====
        ocr_result = extract_text(cv2_image)
        result["ocr"] = ocr_result
        result["step"] = "ocr"
        result["success"] = True
        result["message"] = "OCR로 텍스트를 추출했습니다"
        
        print("=" * 60)
        print("✅ 분석 완료")
        print("=" * 60 + "\n")
        
        return result
        
    except Exception as e:
        print(f"❌ 분석 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        return {
            "step": "error",
            "success": False,
            "error": str(e),
            "message": f"분석 중 오류가 발생했습니다: {e}"
        }


# 하위 호환성 유지 (기존 endpoints.py 지원)
def analyze_image(image_bytes: bytes) -> dict:
    """기존 API와의 호환성을 위한 래퍼 함수"""
    return analyze_supplement(image_bytes)
