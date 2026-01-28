"""
통합 분석 서비스 (오케스트레이터) - FINAL FIXED VERSION

[핵심 수정 사항]
1. 이미지 로드 시점 통일: analysis_service에서 로드한 PIL 객체를 YOLO에 전달 (좌표계 동기화)
2. Crop 좌표 보정: 정수 변환 및 Padding 추가
3. 에러 핸들링 강화
"""

import io
import os
from PIL import Image
import numpy as np
import cv2

# SaveImage 폴더 설정
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVE_IMAGE_DIR = os.path.join(APP_DIR, "SaveImage")
os.makedirs(SAVE_IMAGE_DIR, exist_ok=True)

# 서비스 임포트
from app.services.yolo_service import detect_supplements
from app.services.barcode_service import detect_barcode
from app.services.ocr_service import extract_text
# 유틸리티 임포트
from app.utils import load_image_with_exif


def analyze_supplement(image_bytes: bytes) -> dict:
    print("\n" + "=" * 60)
    print("🔬 영양제 종합 분석 시작 (좌표 동기화 & 안전 모드)")
    print("=" * 60)
    
    try:
        result = {
            "step": None,
            "success": False,
            "yolo": None,
            "barcode": None,
            "ocr": None,
            "processing_info": None,
            "frontend_data": {
                "object_count": 0,
                "products": []
            }
        }
        
        # [디버깅] 수신된 원본 바이트 저장 (SaveImage 폴더에 debug_input.jpg로 저장)
        debug_path = os.path.join(SAVE_IMAGE_DIR, "debug_input.jpg")
        try:
            with open(debug_path, "wb") as f:
                f.write(image_bytes)
            print(f"[디버깅] 📥 수신 이미지 저장 완료: {debug_path} (Size: {len(image_bytes)} bytes)")
        except Exception as save_err:
            print(f"[디버깅] ⚠️ 수신 이미지 저장 실패: {save_err}")

        # [1단계] 이미지 로드 및 유효성 검사
        print(f"[1단계] 이미지 로드 시작...")
        try:
            original_pil = load_image_with_exif(image_bytes)
            print(f" - 이미지 타입: {type(original_pil)}, 사이즈: {original_pil.size}")
        except Exception as img_err:
            print(f" - ❌ 이미지 로드 실패: {img_err}")
            raise
            
        orig_w, orig_h = original_pil.size
        
        # [2단계] YOLO 탐지 실행
        print(f"[2단계] YOLO 탐지 시작 (PIL 전달)...")
        yolo_result = detect_supplements(original_pil)
        print(f" - 탐지 결과: {yolo_result['detected']}, 탐지수: {yolo_result['count']}")
        
        # 결과 정리
        processed_pil = yolo_result.pop("pil_image", None)
        result["yolo"] = yolo_result
        result["processing_info"] = yolo_result.get("scale_info", {})
        
        if not yolo_result["detected"]:
            all_labels = [obj["label"] for obj in yolo_result.get("objects", [])]
            result["step"] = "yolo"
            result["message"] = "이미지에서 영양제를 찾지 못했습니다"
            print(f"⚠️ [분석 중단] 영양제 미탐지 (검출된 모든 라벨: {all_labels})")
            
            # [디버깅] 영양제가 아니더라도 다른 라벨이 있다면 OCR을 시도해볼 수 있게 로그만 남김
            if yolo_result.get("objects"):
                print(f" - 참고: 영양제는 아니지만 다른 객체가 탐지되었습니다.")
            return result
        
        print(f"[3단계] OCR 분석 단계 진입 (객체 수: {len(yolo_result.get('objects', []))})")
        # (혹시 모르니 리사이징된 버전으로 빠르게 훑기)
        if processed_pil:
            cv2_full_image = cv2.cvtColor(np.array(processed_pil), cv2.COLOR_RGB2BGR)
            barcode_result = detect_barcode(cv2_full_image)
            result["barcode"] = barcode_result
            
            if barcode_result["found"] and barcode_result.get("db_result"):
                result["step"] = "barcode"
                result["success"] = True
                result["message"] = "바코드로 제품 정보를 찾았습니다"
                
                # 프론트엔드용 데이터도 채워줌
                result["frontend_data"] = {
                    "object_count": 1,
                    "products": [{
                        "name": barcode_result["db_result"].get("name", "알 수 없는 제품"),
                        "barcode": barcode_result["data"],
                        "confidence": 1.0,
                        "box": [0, 0, orig_w, orig_h] # 전체 이미지 혹은 대략적 위치 (여기선 전체)
                    }]
                }
                return result
        
        # ===== 3단계: 크롭 기반 OCR 분석 (좌표 동기화됨) =====
        print(f"[통합 분석] === 크롭 분석 단계 시작 (객체 수: {len(yolo_result.get('objects', []))}) ===")
        
        analysis_results = []
        
        for i, obj in enumerate(yolo_result.get("objects", [])):
            if obj["label"] == "supplement":
                # YOLO가 준 좌표 (이제 original_pil 기준과 100% 일치함)
                box = obj["box"] # [x1, y1, x2, y2]
                
                try:
                    # [중요 3] 좌표 정수 변환 및 Padding
                    # 박스를 너무 타이트하게 자르면 글자가 잘릴 수 있으니 여유(padding)를 줌
                    padding = 15 
                    x1 = max(0, int(box[0]) - padding)
                    y1 = max(0, int(box[1]) - padding)
                    x2 = min(orig_w, int(box[2]) + padding)
                    y2 = min(orig_h, int(box[3]) + padding)

                    # Crop 수행 (원본 고화질에서 자름)
                    cropped_pil = original_pil.crop((x1, y1, x2, y2))
                    
                    # PaddleOCR용 OpenCV 포맷 변환
                    cropped_cv2 = cv2.cvtColor(np.array(cropped_pil), cv2.COLOR_RGB2BGR)
                    
                    # 바코드 재탐지
                    barcode_item = detect_barcode(cropped_cv2)
                    
                    # OCR 수행
                    print(f"[통합 분석] 객체 #{i} OCR 추출 시도... (크기: {x2-x1}x{y2-y1})")
                    ocr_item = extract_text(cropped_cv2, save_image=True)
                    
                    analysis_results.append({
                        "object_index": i,
                        "label": obj["label"],
                        "confidence": obj["confidence"],
                        "box": box,
                        "barcode": barcode_item,
                        "ocr": ocr_item
                    })
                except Exception as crop_err:
                    print(f"[통합 분석] ❌ 객체 #{i} 크롭/분석 실패: {crop_err}")
                    import traceback
                    traceback.print_exc()
        
        # ===== 4단계: 프론트엔드용 데이터 정제 =====
        frontend_products = []
        for res in analysis_results:
            # 제품명 결정 로직: 1. DB 결과 -> 2. OCR 첫 줄 -> 3. 기본값
            product_name = "알 수 없는 영양제"
            if res["barcode"]["found"] and res["barcode"].get("db_result"):
                product_name = res["barcode"]["db_result"].get("name", product_name)
            elif res["ocr"]["texts"]:
                # OCR 결과 중 첫 번째(가장 큰/상단) 텍스트를 이름으로 가제
                product_name = res["ocr"]["texts"][0]["text"]
            
            frontend_products.append({
                "name": product_name,
                "barcode": res["barcode"]["data"] if res["barcode"]["found"] else None,
                "confidence": res["confidence"],
                "box": res["box"]
            })
            
        result["frontend_data"] = {
            "object_count": len(frontend_products),
            "products": frontend_products
        }
        
        result["ocr"] = analysis_results # 하위 호환
        result["analysis_results"] = analysis_results
        result["step"] = "final"
        result["success"] = True
        result["message"] = f"{len(analysis_results)}개의 객체에 대해 분석을 완료했습니다"
        
        print(f"[통합 분석] 정제된 데이터: {len(frontend_products)}개 제품")
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
    return analyze_supplement(image_bytes)