"""
통합 분석 서비스 (오케스트레이터)

YOLO, 바코드, OCR 서비스를 조율하여 영양제 이미지를 종합 분석합니다.

분석 파이프라인:
1. YOLO 객체탐지 (영양제 검출) - 바이트 직접 전달로 최고 성능 유지
2. 바코드 탐지 → DB 조회
3. OCR 텍스트 추출
"""

import io
from PIL import Image
import numpy as np
import cv2

# 서비스 임포트
from app.services.yolo_service import detect_supplements
from app.services.barcode_service import detect_barcode
from app.services.ocr_service import extract_text


# ============================================================
# 통합 분석 함수
# ============================================================

def analyze_supplement(image_bytes: bytes) -> dict:
    """
    영양제 이미지를 종합 분석합니다.
    
    분석 순서:
    1. YOLO 객체탐지 (바이트 직접 전달 - 최고 성능)
    2. 바코드 탐지
    3. OCR 텍스트 추출
    
    Args:
        image_bytes: 원본 이미지 바이트 데이터
        
    Returns:
        종합 분석 결과 딕셔너리
    """
    print("\n" + "=" * 60)
    print("🔬 영양제 종합 분석 시작")
    print("=" * 60)
    
    try:
        result = {
            "step": None,
            "success": False,
            "yolo": None,
            "barcode": None,
            "ocr": None,
            "processing_info": None
        }
        
        # ===== 1단계: YOLO 객체탐지 (바이트 직접 전달) =====
        # 작은 이미지는 원본 유지, 큰 이미지만 리사이징 (YOLO 내부에서 수행)
        yolo_result = detect_supplements(image_bytes)
        
        # 중요: pil_image는 JSON 직렬화가 안 되므로 결과 딕셔너리에서 분리
        processed_pil = yolo_result.pop("pil_image", None)
        
        result["yolo"] = yolo_result
        result["processing_info"] = yolo_result.get("scale_info", {})
        
        if not yolo_result["detected"]:
            result["step"] = "yolo"
            result["message"] = "이미지에서 영양제를 찾지 못했습니다"
            print("⚠️ 영양제 미탐지 - 분석 종료")
            return result
        
        # ===== 바코드/OCR을 위한 이미지 준비 (YOLO에서 리사이징된 이미지 재사용) =====
        # 고해상도 이미지의 경우 리사이징된 버전을 사용하여 성능 및 메모리 효율 확보
        if processed_pil is None:
            # 안전장치: 혹시 이미지가 없으면 새로 로드
            processed_pil = Image.open(io.BytesIO(image_bytes))
            
        cv2_image = cv2.cvtColor(np.array(processed_pil), cv2.COLOR_RGB2BGR)
        
        # ===== 2단계: 바코드 탐지 =====
        barcode_result = detect_barcode(cv2_image)
        result["barcode"] = barcode_result
        
        if barcode_result["found"] and barcode_result.get("db_result"):
            result["step"] = "barcode"
            result["success"] = True
            result["message"] = "바코드로 제품 정보를 찾았습니다"
            print("✅ 바코드 DB 조회 성공 - 분석 완료")
            return result
        
        # ===== 3단계: OCR 텍스트 추출 (리사이징된 이미지 사용) =====
        # OCR 서비스 내부에 save_image=True 옵션이 있어 SaveImage 폴더에 저장됨
        ocr_result = extract_text(cv2_image, save_image=True)
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


# 하위 호환성 유지
def analyze_image(image_bytes: bytes) -> dict:
    """기존 API와의 호환성을 위한 래퍼 함수"""
    return analyze_supplement(image_bytes)
