"""
AI 분석 서비스 모듈

이 모듈은 영양제 이미지 분석을 위한 통합 파이프라인을 제공합니다.
분석 순서:
1. YOLO 객체탐지 → 영양제(supplement) 검출
2. 바코드 탐지 → DB 조회 시도
3. OCR 텍스트 추출 → 제품명/성분 정보 추출

⚠️ 주의: OCR은 별도 프로세스(ocr_worker.py)로 실행됩니다.
   이유: PaddlePaddle과 PyTorch(YOLO) 간의 DLL 충돌 방지
"""

import os
import io
import json
import subprocess
import tempfile
from PIL import Image
import numpy as np
import cv2
from ultralytics import YOLO

from app.utils import preprocess_image, pil_to_cv2

# ============================================================
# 모델 초기화 (서버 시작 시 한 번만 로드)
# ============================================================

# YOLO 모델 초기화 (영양제 탐지용)
try:
    yolo_model = YOLO("Version3.pt")
    yolo_model_info = "Custom (Version3.pt) - 영양제 탐지"
    print(f"[초기화] YOLO 모델 로드 성공: {yolo_model_info}")
except Exception as e:
    print(f"[초기화] YOLO 모델 로드 실패: {e}")
    yolo_model = None
    yolo_model_info = "로드 실패"

# OCR Worker 스크립트 경로 (fastapi 폴더 기준)
# __file__ = fastapi/app/services/ai_service.py
# dirname(__file__) = fastapi/app/services
# dirname(dirname(__file__)) = fastapi/app  
# dirname(dirname(dirname(__file__))) = fastapi
FASTAPI_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OCR_WORKER_PATH = os.path.join(FASTAPI_DIR, "ocr_worker.py")
PYTHON_PATH = os.path.join(FASTAPI_DIR, "venv", "Scripts", "python.exe")

print(f"[초기화] FastAPI 디렉토리: {FASTAPI_DIR}")
print(f"[초기화] OCR Worker 경로: {OCR_WORKER_PATH}")
print(f"[초기화] Python 경로: {PYTHON_PATH}")
print(f"[초기화] OCR Worker 존재 여부: {os.path.exists(OCR_WORKER_PATH)}")
print(f"[초기화] Python 존재 여부: {os.path.exists(PYTHON_PATH)}")

# ============================================================
# 분석 함수들
# ============================================================

def detect_objects_yolo(pil_image: Image.Image, confidence_threshold: float = 0.3) -> dict:
    """
    YOLO를 사용하여 이미지에서 영양제 객체를 탐지합니다.
    """
    if yolo_model is None:
        return {"detected": False, "error": "YOLO 모델이 로드되지 않았습니다", "objects": []}
    
    print(f"\n[YOLO] === 객체 탐지 시작 ===")
    print(f"[YOLO] 입력 이미지 크기: {pil_image.size}")
    print(f"[YOLO] 신뢰도 임계값: {confidence_threshold}")
    
    # YOLO 추론 실행
    results = yolo_model(pil_image, conf=0.01, imgsz=640)
    
    detected_objects = []
    
    for r in results:
        boxes = r.boxes
        if len(boxes) == 0:
            print("[YOLO] ⚠️ 탐지된 객체 없음")
            continue
            
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = yolo_model.names[cls_id]
            coords = box.xyxy[0].tolist()
            
            status = "✅ PASS" if conf >= confidence_threshold else "❌ FAIL"
            print(f"[YOLO] [{status}] {label} (신뢰도: {conf:.2%})")
            
            if conf >= confidence_threshold:
                detected_objects.append({
                    "label": label,
                    "confidence": round(conf, 2),
                    "box": coords
                })
    
    has_supplement = any(obj['label'] == 'supplement' for obj in detected_objects)
    
    print(f"[YOLO] 최종 채택 객체 수: {len(detected_objects)}")
    print(f"[YOLO] 영양제 탐지 여부: {'✅ 예' if has_supplement else '❌ 아니오'}")
    print(f"[YOLO] === 객체 탐지 완료 ===\n")
    
    return {
        "detected": has_supplement,
        "objects": detected_objects,
        "count": len(detected_objects)
    }


def detect_barcode(cv2_image: np.ndarray) -> dict:
    """
    OpenCV를 사용하여 이미지에서 바코드를 탐지합니다.
    """
    print(f"\n[바코드] === 바코드 탐지 시작 ===")
    
    try:
        detector = cv2.barcode.BarcodeDetector()
        decoded_info, decoded_type, points = detector.detectAndDecode(cv2_image)
        
        if decoded_info and any(decoded_info):
            barcode_data = decoded_info[0] if isinstance(decoded_info, tuple) else decoded_info
            print(f"[바코드] ✅ 바코드 발견: {barcode_data}")
            print(f"[바코드] === 바코드 탐지 완료 ===\n")
            
            return {
                "found": True,
                "data": barcode_data,
                "type": decoded_type[0] if decoded_type else "unknown",
                "db_result": None
            }
        else:
            print("[바코드] ❌ 바코드를 찾지 못했습니다")
            print(f"[바코드] === 바코드 탐지 완료 ===\n")
            return {"found": False, "data": None, "db_result": None}
            
    except Exception as e:
        print(f"[바코드] 오류 발생: {e}")
        return {"found": False, "data": None, "error": str(e)}


def extract_text_ocr(cv2_image: np.ndarray) -> dict:
    """
    OCR을 사용하여 이미지에서 텍스트를 추출합니다.
    ⚠️ 별도 프로세스(ocr_worker.py)로 실행하여 DLL 충돌 방지
    """
    print(f"\n[OCR] === 텍스트 추출 시작 (subprocess) ===")
    
    try:
        # 임시 파일로 이미지 저장
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
            tmp_path = tmp_file.name
            cv2.imwrite(tmp_path, cv2_image)
            print(f"[OCR] 임시 파일 저장: {tmp_path}")
        
        # subprocess로 OCR 실행
        result = subprocess.run(
            [PYTHON_PATH, OCR_WORKER_PATH, tmp_path],
            capture_output=True,
            text=True,
            timeout=60  # 60초 타임아웃
        )
        
        # 임시 파일 삭제
        os.unlink(tmp_path)
        
        if result.returncode != 0:
            print(f"[OCR] ❌ 오류: {result.stderr}")
            return {"texts": [], "error": result.stderr}
        
        # JSON 결과 파싱
        ocr_result = json.loads(result.stdout)
        
        if ocr_result.get("success"):
            texts = ocr_result.get("texts", [])
            for item in texts:
                print(f"[OCR] 📝 '{item['text']}' (신뢰도: {item['confidence']:.0%})")
            
            print(f"[OCR] 추출된 텍스트 수: {len(texts)}")
            print(f"[OCR] === 텍스트 추출 완료 ===\n")
            
            return {
                "texts": texts,
                "count": len(texts)
            }
        else:
            return {"texts": [], "error": ocr_result.get("error", "알 수 없는 오류")}
        
    except subprocess.TimeoutExpired:
        print(f"[OCR] ❌ 타임아웃 (60초 초과)")
        return {"texts": [], "error": "OCR 타임아웃"}
    except json.JSONDecodeError as e:
        print(f"[OCR] ❌ JSON 파싱 오류: {e}")
        return {"texts": [], "error": f"JSON 파싱 오류: {e}"}
    except Exception as e:
        print(f"[OCR] ❌ 오류 발생: {e}")
        return {"texts": [], "error": str(e)}


# ============================================================
# 통합 분석 함수 (메인 엔트리 포인트)
# ============================================================

def analyze_supplement(image_bytes: bytes) -> dict:
    """
    영양제 이미지를 종합 분석합니다.
    """
    print("\n" + "="*60)
    print("🔬 영양제 종합 분석 시작")
    print("="*60)
    
    try:
        # 1단계: 이미지 전처리
        pil_image, cv2_image, scale_info = preprocess_image(image_bytes)
        
        result = {
            "step": None,
            "success": False,
            "yolo": None,
            "barcode": None,
            "ocr": None,
            "processing_info": scale_info
        }
        
        # 2단계: YOLO 객체탐지
        yolo_result = detect_objects_yolo(pil_image)
        result["yolo"] = yolo_result
        
        if not yolo_result["detected"]:
            result["step"] = "yolo"
            result["message"] = "이미지에서 영양제를 찾지 못했습니다"
            print("⚠️ 영양제 미탐지 - 분석 종료")
            return result
        
        # 3단계: 바코드 탐지
        barcode_result = detect_barcode(cv2_image)
        result["barcode"] = barcode_result
        
        if barcode_result["found"] and barcode_result.get("db_result"):
            result["step"] = "barcode"
            result["success"] = True
            result["message"] = "바코드로 제품 정보를 찾았습니다"
            return result
        
        # 4단계: OCR 텍스트 추출
        ocr_result = extract_text_ocr(cv2_image)
        result["ocr"] = ocr_result
        result["step"] = "ocr"
        result["success"] = True
        result["message"] = "OCR로 텍스트를 추출했습니다"
        
        print("="*60)
        print("✅ 분석 완료")
        print("="*60 + "\n")
        
        return result
        
    except Exception as e:
        print(f"❌ 분석 중 오류 발생: {e}")
        return {
            "step": "error",
            "success": False,
            "error": str(e),
            "message": f"분석 중 오류가 발생했습니다: {e}"
        }


# 하위 호환성 유지
def analyze_image(image_bytes: bytes) -> dict:
    return analyze_supplement(image_bytes)