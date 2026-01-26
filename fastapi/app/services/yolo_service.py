"""
YOLO 객체탐지 서비스

영양제(supplement) 객체를 탐지하는 YOLO 모델 서비스입니다.
"""

import os
from PIL import Image
from ultralytics import YOLO

# ============================================================
# 모델 초기화
# ============================================================

# YOLO 모델 경로 (fastapi 폴더 기준)
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "Version3.pt"
)

# 모델 로드
try:
    model = YOLO(MODEL_PATH)
    model_info = f"Version3.pt 로드 완료"
    print(f"[YOLO 서비스] ✅ 모델 로드 성공: {model_info}")
except Exception as e:
    print(f"[YOLO 서비스] ❌ 모델 로드 실패: {e}")
    model = None
    model_info = "로드 실패"


# ============================================================
# 탐지 함수
# ============================================================

def detect_supplements(pil_image: Image.Image, confidence_threshold: float = 0.3) -> dict:
    """
    이미지에서 영양제 객체를 탐지합니다.
    
    Args:
        pil_image: PIL Image 객체
        confidence_threshold: 신뢰도 임계값 (기본 0.3)
        
    Returns:
        탐지 결과 딕셔너리 {detected, objects, count}
    """
    if model is None:
        return {
            "detected": False,
            "error": "YOLO 모델이 로드되지 않았습니다",
            "objects": []
        }
    
    print(f"\n[YOLO] === 객체 탐지 시작 ===")
    print(f"[YOLO] 입력 이미지 크기: {pil_image.size}")
    print(f"[YOLO] 신뢰도 임계값: {confidence_threshold}")
    
    # YOLO 추론 실행
    results = model(pil_image, conf=0.01, imgsz=640)
    
    detected_objects = []
    
    for r in results:
        boxes = r.boxes
        if len(boxes) == 0:
            print("[YOLO] ⚠️ 탐지된 객체 없음")
            continue
            
        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = model.names[cls_id]
            coords = box.xyxy[0].tolist()
            
            status = "✅ PASS" if conf >= confidence_threshold else "❌ FAIL"
            print(f"[YOLO] [{status}] {label} (신뢰도: {conf:.2%})")
            
            if conf >= confidence_threshold:
                detected_objects.append({
                    "label": label,
                    "confidence": round(conf, 2),
                    "box": coords
                })
    
    # 영양제(supplement) 탐지 여부 확인
    has_supplement = any(obj["label"] == "supplement" for obj in detected_objects)
    
    print(f"[YOLO] 최종 채택 객체 수: {len(detected_objects)}")
    print(f"[YOLO] 영양제 탐지 여부: {'✅ 예' if has_supplement else '❌ 아니오'}")
    print(f"[YOLO] === 객체 탐지 완료 ===\n")
    
    return {
        "detected": has_supplement,
        "objects": detected_objects,
        "count": len(detected_objects)
    }
