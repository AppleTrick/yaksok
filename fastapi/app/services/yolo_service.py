"""
YOLO 객체탐지 서비스 - UPDATED BY Z-MINAI
"""

import os
import io
from PIL import Image, ImageOps
from ultralytics import YOLO

# 모델 경로 등은 기존 유지
MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "model",
    "Version3.pt"
)

try:
    model = YOLO(MODEL_PATH)
    print(f"[YOLO 서비스] ✅ 모델 로드 성공 (경로: {MODEL_PATH})")
    print(f"[YOLO 서비스] 🏷️ 모델 라벨: {model.names}")
except Exception as e:
    print(f"[YOLO 서비스] ❌ 모델 로드 실패: {e}")
    model = None

# ============================================================
# 탐지 함수 (수정됨)
# ============================================================

def detect_supplements(image_input, confidence_threshold: float = 0.3) -> dict:
    if model is None:
        return {"detected": False, "objects": []}
    
    # [수정 핵심] 입력이 PIL Image면 그대로 쓴다! (중복 로드/회전 방지)
    if isinstance(image_input, Image.Image):
        pil_image = image_input
        # 이미 로드된 객체니까 사이즈 바로 잰다
        orig_width, orig_height = pil_image.size
        print(f"[YOLO] 입력받은 PIL 이미지: {orig_width}x{orig_height}")
        
    elif isinstance(image_input, bytes):
        # 바이트로 들어오면 어쩔 수 없이 로드 (기존 로직)
        pil_image = Image.open(io.BytesIO(image_input))
        try:
            pil_image = ImageOps.exif_transpose(pil_image)
        except:
            pass
        orig_width, orig_height = pil_image.size
    else:
        return {"detected": False, "error": "지원하지 않는 이미지 타입"}

    # 리사이징 로직 (메모리 터짐 방지)
    max_size = 1000
    max_dim = max(orig_width, orig_height)
    
    scale_info = {
        "scale_x": 1.0, 
        "scale_y": 1.0, 
        "resized": False,
        "original_size": {"width": orig_width, "height": orig_height}
    }
    
    # 추론용 이미지 (detected_image) 준비
    detect_image = pil_image.copy()
    
    if max_dim > max_size:
        print(f"[YOLO] 리사이징 수행: {orig_width}x{orig_height} -> {max_size}px 기준")
        detect_image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        new_w, new_h = detect_image.size
        
        scale_info["resized"] = True
        scale_info["scale_x"] = orig_width / new_w
        scale_info["scale_y"] = orig_height / new_h
        scale_info["processed_size"] = {"width": new_w, "height": new_h}
    else:
        print(f"[YOLO] 원본 크기 유지")

    # YOLO 추론
    print(f"[YOLO] 추론 시작 (imgsz=640, conf={confidence_threshold})...")
    results = model(detect_image, conf=confidence_threshold, imgsz=640)
    
    detected_objects = []
    
    for r in results:
        boxes = r.boxes
        print(f"[YOLO] 원시 탐지 객체 수: {len(boxes)}")
        for i, box in enumerate(boxes):
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            label = model.names[cls_id]
            
            # 리사이즈된 좌표 (x1, y1, x2, y2)
            coords = box.xyxy[0].tolist()
            
            print(f"  - 객체 #{i}: {label} ({conf:.2f})")
            
            # [중요] 원본 좌표로 복구
            if scale_info["resized"]:
                coords = [
                    coords[0] * scale_info["scale_x"],
                    coords[1] * scale_info["scale_y"],
                    coords[2] * scale_info["scale_x"],
                    coords[3] * scale_info["scale_y"]
                ]
            
            print(f"[YOLO] 탐지 객체: {label} (conf: {conf:.2f})")
            
            detected_objects.append({
                "label": label,
                "confidence": round(conf, 2),
                "box": coords
            })
            
    has_supplement = any(obj["label"] == "supplement" for obj in detected_objects)
    
    return {
        "detected": has_supplement,
        "objects": detected_objects,
        "count": len(detected_objects),
        "scale_info": scale_info
    }