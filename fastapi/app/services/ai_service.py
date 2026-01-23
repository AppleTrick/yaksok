
import io
from PIL import Image
from ultralytics import YOLO

# Initialize YOLO11 model
# Using Custom model: Version3.pt (Trained for 'supplement')
try:
    model = YOLO("Version3.pt")
    model_type = "Custom (Version3.pt)"
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    model_type = "None"

def analyze_image(image_bytes: bytes) -> dict:
    """
    Analyze image using Custom YOLO11m (Version3).
    Target class: supplement
    """
    if model is None:
        return {"error": "Model not loaded", "is_supplement": False}

    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Inference 실행
        # conf=0.5로 상향하여 확실한 결과만 필터링 (오탐 방지)
        # Inference 실행 (디버깅을 위해 conf를 0.01로 매우 낮게 설정하여 모든 가능성 확인)
        results = model(image, conf=0.01, imgsz=640) 
        
        # Process results
        detected_objects = []
        THRESHOLD = 0.3 # 사용자 설정 임계값
        
        print(f"\n[DEBUG] === Version3.pt 상세 분석 시작 ===")
        print(f"[DEBUG] 현재 임계값(Threshold): {THRESHOLD}")
        
        for r in results:
            boxes = r.boxes
            if len(boxes) == 0:
                print(f"[DEBUG] ⚠️ 탐지된 객체가 아예 없습니다 (Confidence > 0.01 기준)")
                
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                coords = box.xyxy[0].tolist()
                
                # 로그 출력 (신뢰도 상관없이 모두)
                status = "✅ PASS" if conf >= THRESHOLD else "❌ FAIL (low conf)"
                print(f"[DEBUG] [{status}] 발견: {label} (점수: {conf:.4f})")
                
                # 임계값을 넘는 경우만 결과 리스트에 추가
                if conf >= THRESHOLD:
                    detected_objects.append({
                        "label": label,
                        "confidence": round(conf, 2),
                        "box": coords
                    })
        
        print(f"[DEBUG] 최종 채택된 객체 수: {len(detected_objects)}")
        print(f"[DEBUG] === 분석 종료 ===\n")

        # 영양제 판별 로직: 'supplement' 클래스 존재 여부 확인
        is_supplement = any(obj['label'] == 'supplement' for obj in detected_objects)

        return {
            "is_supplement": is_supplement,
            "detected_objects": detected_objects,
            "count": len(detected_objects),
            "message": "Custom 영양제 탐지 모델 결과",
            "model_info": model_type
        }
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}
