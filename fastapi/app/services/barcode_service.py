"""
바코드 인식 서비스

이미지에서 바코드를 탐지하고 DB 조회를 수행하는 서비스입니다.
"""

import numpy as np
import cv2


# ============================================================
# 바코드 탐지 함수
# ============================================================

def detect_barcode(cv2_image: np.ndarray) -> dict:
    """
    이미지에서 바코드를 탐지합니다. (전처리 포함 및 시도 단계 기록)
    """
    print(f"\n[바코드] === 바코드 탐지 시작 (이미지 크기: {cv2_image.shape[1]}x{cv2_image.shape[0]}) ===")
    
    attempts = []
    
    try:
        detector = cv2.barcode.BarcodeDetector()
        
        # 1차 시도: 원본 크롭 이미지
        decoded_info, decoded_type, points = detector.detectAndDecode(cv2_image)
        attempts.append({"step": "원본", "success": bool(decoded_info and any(decoded_info))})
        
        # 2차 시도: 흑백 변환 및 대비 향상
        if not (decoded_info and any(decoded_info)):
            print("[바코드] 1차 시도 실패. 전처리 후 2차 시도...")
            gray = cv2.cvtColor(cv2_image, cv2.COLOR_BGR2GRAY)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(gray)
            decoded_info, decoded_type, points = detector.detectAndDecode(enhanced)
            attempts.append({"step": "대비향상", "success": bool(decoded_info and any(decoded_info))})
            
        # 3차 시도: 2배 확대
        if not (decoded_info and any(decoded_info)):
            print("[바코드] 2차 시도 실패. 확대 후 3차 시도...")
            resized = cv2.resize(cv2_image, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            decoded_info, decoded_type, points = detector.detectAndDecode(resized)
            attempts.append({"step": "2배확대", "success": bool(decoded_info and any(decoded_info))})

        # 결과 처리
        if decoded_info and any(decoded_info):
            barcode_data = decoded_info[0] if isinstance(decoded_info, (tuple, list)) else decoded_info
            barcode_type = decoded_type[0] if decoded_type else "unknown"
            
            print(f"[바코드] ✅ 바코드 발견: {barcode_data} ({barcode_type})")
            db_result = lookup_product_by_barcode(barcode_data)
            
            success_step = next((a["step"] for a in attempts if a["success"]), "unknown")
            
            return {
                "found": True,
                "data": barcode_data,
                "type": barcode_type,
                "message": f"{success_step} 단계에서 인식 성공",
                "attempts": attempts,
                "db_result": db_result
            }
        else:
            print("[바코드] ❌ 모든 시도에서 바코드를 찾지 못했습니다")
            return {
                "found": False, 
                "data": None, 
                "type": None, 
                "message": "3단계 시도(원본, 대비향상, 2배확대) 모두 인식 실패",
                "attempts": attempts
            }
            
    except Exception as e:
        print(f"[바코드] ❌ 오류 발생: {e}")
        return {"found": False, "error": str(e)}


def lookup_product_by_barcode(barcode: str) -> dict | None:
    """
    바코드로 제품 정보를 DB에서 조회합니다.
    
    Args:
        barcode: 바코드 문자열
        
    Returns:
        제품 정보 딕셔너리 또는 None (미발견 시)
    """
    # TODO: 실제 DB 연동 시 구현
    # 현재는 None 반환 (DB 없음)
    print(f"[바코드] DB 조회 시도: {barcode}")
    print(f"[바코드] DB 결과: 없음 (미구현)")
    return None
