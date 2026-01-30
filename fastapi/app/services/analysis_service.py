"""
통합 분석 서비스 (오케스트레이터) - Clean Version

[로그 정리]
- 단계별(Step 1, 2, 3) 과도한 진입 로그 제거
- 디버깅용 이미지 저장 로그 제거 (기능은 유지하되 조용히 수행)
- 핵심 결과(탐지 개수, 성공 여부)만 간결하게 출력
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
from app.services.ocr_service import extract_text
# 유틸리티 임포트
from app.utils import load_image_with_exif


def analyze_supplement(image_bytes: bytes) -> dict:
    print(f"\n[Analysis] 🔬 영양제 종합 분석 시작")
    
    try:
        result = {
            "step": None,
            "success": False,
            "yolo": None,
            "ocr": None,
            "processing_info": None
        }
        
        # 1. 이미지 로드
        try:
            original_pil = load_image_with_exif(image_bytes)
        except Exception as img_err:
            print(f"❌ [Analysis] 이미지 로드 실패: {img_err}")
            raise
            
        orig_w, orig_h = original_pil.size
        
        # 2. YOLO 탐지
        yolo_result = detect_supplements(original_pil)
        
        # 결과 정리
        processed_pil = yolo_result.pop("pil_image", None)
        result["yolo"] = yolo_result
        result["processing_info"] = yolo_result.get("scale_info", {})
        
        obj_count = len(yolo_result.get("objects", []))
        print(f"[Analysis] YOLO 탐지 완료: {obj_count}개 객체 발견")

        if not yolo_result["detected"]:
            result["step"] = "yolo"
            result["message"] = "이미지에서 영양제를 찾지 못했습니다"
            print(f"⚠️ [Analysis] 분석 중단: 영양제 미탐지")
            return result
        
        # 3. 통합 분석 (OCR 위주)
        analysis_results = []
        
        # 객체별 상세 분석 Loop
        for i, obj in enumerate(yolo_result.get("objects", [])):
            if obj["label"] == "supplement":
                box = obj["box"] # [x1, y1, x2, y2]
                
                try:
                    # Padding & Crop
                    padding = 15 
                    x1 = max(0, int(box[0]) - padding)
                    y1 = max(0, int(box[1]) - padding)
                    x2 = min(orig_w, int(box[2]) + padding)
                    y2 = min(orig_h, int(box[3]) + padding)

                    cropped_pil = original_pil.crop((x1, y1, x2, y2))
                    cropped_cv2 = cv2.cvtColor(np.array(cropped_pil), cv2.COLOR_RGB2BGR)
                    
                    # OCR 수행
                    print(f"[Analysis] 객체 #{i+1} 분석 중 (OCR)...")
                    ocr_item = extract_text(cropped_cv2, save_image=False)
                    
                    analysis_results.append({
                        "object_index": i,
                        "label": obj["label"],
                        "confidence": obj["confidence"],
                        "box": box,
                        "ocr": ocr_item
                    })
                except Exception as crop_err:
                    print(f"❌ [Analysis] 객체 #{i+1} 분석 실패: {crop_err}")
        
        # 4. 데이터 정제 및 반환
        raw_results = []
        for res in analysis_results:
            ocr_info = res["ocr"]
            lines_data = ocr_info.get("lines", []) # [{text, confidence}, ...]
            
            raw_results.append({
                "box": res["box"],
                "confidence": res["confidence"],
                "ocr_text": ocr_info.get("text", ""),    # 전체 텍스트 (줄바꿈 포함)
                "ocr_texts": [line["text"] for line in lines_data], # 하위 호환성 (줄별 텍스트 리스트)
                "ocr_lines": lines_data                  # 상세 라인 정보 (정확도 포함)
            })
            
        result["analysis_results"] = raw_results
    
        result["step"] = "final"
        result["success"] = True
        result["message"] = f"{len(raw_results)} objects detected"
        
        print(f"[Analysis] ✅ 분석 완료: {len(raw_results)}개 객체 데이터 반환")
        return result
        
    except Exception as e:
        print(f"❌ [Analysis] 치명적 오류: {e}")
        import traceback
        traceback.print_exc()
        return {
            "step": "error",
            "success": False,
            "error": str(e),
            "message": "분석 중 서버 오류가 발생했습니다."
        }

# 하위 호환성 유지
def analyze_image(image_bytes: bytes) -> dict:
    return analyze_supplement(image_bytes)