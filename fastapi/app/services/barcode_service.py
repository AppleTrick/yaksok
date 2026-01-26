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
    이미지에서 바코드를 탐지합니다.
    
    Args:
        cv2_image: OpenCV 형식 이미지 (BGR)
        
    Returns:
        바코드 탐지 결과 {found, data, type, db_result}
    """
    print(f"\n[바코드] === 바코드 탐지 시작 ===")
    
    try:
        detector = cv2.barcode.BarcodeDetector()
        decoded_info, decoded_type, points = detector.detectAndDecode(cv2_image)
        
        # 바코드가 발견되었는지 확인
        if decoded_info and any(decoded_info):
            barcode_data = decoded_info[0] if isinstance(decoded_info, tuple) else decoded_info
            barcode_type = decoded_type[0] if decoded_type else "unknown"
            
            print(f"[바코드] ✅ 바코드 발견: {barcode_data}")
            print(f"[바코드] 바코드 타입: {barcode_type}")
            
            # DB 조회 시도 (현재는 미구현)
            db_result = lookup_product_by_barcode(barcode_data)
            
            print(f"[바코드] === 바코드 탐지 완료 ===\n")
            
            return {
                "found": True,
                "data": barcode_data,
                "type": barcode_type,
                "db_result": db_result
            }
        else:
            print("[바코드] ❌ 바코드를 찾지 못했습니다")
            print(f"[바코드] === 바코드 탐지 완료 ===\n")
            return {
                "found": False,
                "data": None,
                "type": None,
                "db_result": None
            }
            
    except Exception as e:
        print(f"[바코드] ❌ 오류 발생: {e}")
        return {
            "found": False,
            "data": None,
            "error": str(e)
        }


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
