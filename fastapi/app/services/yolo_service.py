"""
YOLO 객체탐지 서비스

영양제(supplement) 객체를 탐지하는 YOLO 모델 서비스입니다.

성능 최적화:
- 작은 이미지(1000px 이하): 원본 그대로 사용 (최고 성능 유지)
- 큰 이미지(1000px 초과): 리사이징 후 사용 (메모리 최적화)
"""

import os
import io
from PIL import Image, ImageOps
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
# 이미지 전처리 (YOLO 전용)
# ============================================================

def prepare_image_for_yolo(image_bytes: bytes, max_size: int = 1000) -> tuple:
    """
    YOLO 추론을 위한 이미지 준비.
    
    - 작은 이미지 (max_size 이하): 원본 그대로 사용 (최고 성능)
    - 큰 이미지 (max_size 초과): EXIF 처리 + 리사이징
    
    Returns:
        (PIL Image, scale_info dict)
    """
    # 기본 이미지 로드 (원본 그대로)
    image = Image.open(io.BytesIO(image_bytes))
    orig_width, orig_height = image.size
    max_dim = max(orig_width, orig_height)
    
    scale_info = {
        "original_size": {"width": orig_width, "height": orig_height},
        "processed_size": {"width": orig_width, "height": orig_height},
        "resized": False,
        "scale_x": 1.0,
        "scale_y": 1.0
    }
    
    # 작은 이미지: 원본 그대로 사용 (성능 최적화)
    if max_dim <= max_size:
        print(f"[YOLO 전처리] 원본 사용 (크기 적정): {orig_width}x{orig_height}")
        return image, scale_info
    
    # 큰 이미지: EXIF 처리 + 리사이징 필요
    print(f"[YOLO 전처리] 리사이징 필요: {orig_width}x{orig_height} > {max_size}px")
    
    # EXIF 회전 처리 (스마트폰 사진 대응)
    try:
        image = ImageOps.exif_transpose(image)
    except Exception as e:
        print(f"[YOLO 전처리] EXIF 처리 오류 (무시): {e}")
    
    # 리사이징 (비율 유지)
    image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
    new_width, new_height = image.size
    
    scale_info["processed_size"] = {"width": new_width, "height": new_height}
    scale_info["resized"] = True
    scale_info["scale_x"] = orig_width / new_width
    scale_info["scale_y"] = orig_height / new_height
    
    print(f"[YOLO 전처리] 리사이징 완료: {orig_width}x{orig_height} → {new_width}x{new_height}")
    
    return image, scale_info


# ============================================================
# 탐지 함수
# ============================================================

def detect_supplements(image_input, confidence_threshold: float = 0.3) -> dict:
    """
    이미지에서 영양제 객체를 탐지합니다.
    
    Args:
        image_input: PIL Image 객체 또는 이미지 바이트
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
    
    # 이미지 타입 확인 및 변환
    if isinstance(image_input, bytes):
        # 바이트 입력: 직접 전처리
        pil_image, scale_info = prepare_image_for_yolo(image_input)
    elif isinstance(image_input, Image.Image):
        # PIL Image 입력: 그대로 사용
        pil_image = image_input
        scale_info = {
            "original_size": {"width": pil_image.size[0], "height": pil_image.size[1]},
            "processed_size": {"width": pil_image.size[0], "height": pil_image.size[1]},
            "resized": False,
            "scale_x": 1.0,
            "scale_y": 1.0
        }
    else:
        return {
            "detected": False,
            "error": f"지원하지 않는 이미지 타입: {type(image_input)}",
            "objects": []
        }
    
    print(f"\n[YOLO] === 객체 탐지 시작 ===")
    print(f"[YOLO] 입력 이미지 크기: {pil_image.size}")
    print(f"[YOLO] 신뢰도 임계값: {confidence_threshold}")
    
    # YOLO 추론 실행 (기존과 동일한 파라미터)
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
            
            # 리사이징된 경우 좌표를 원본 크기로 복원
            if scale_info["resized"]:
                coords = [
                    coords[0] * scale_info["scale_x"],
                    coords[1] * scale_info["scale_y"],
                    coords[2] * scale_info["scale_x"],
                    coords[3] * scale_info["scale_y"]
                ]
            
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
        "count": len(detected_objects),
        "scale_info": scale_info,
        "pil_image": pil_image  # 처리된 이미지 객체 반환
    }
