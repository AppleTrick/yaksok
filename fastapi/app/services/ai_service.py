
import io
from PIL import Image
from ultralytics import YOLO

# Initialize YOLO11 model with custom weights
# 학습한 가중치 파일 적용
model = YOLO("yolo11m.pt") 

def analyze_image(image_bytes: bytes) -> dict:
    """
    Analyze image using custom trained YOLO11.
    """
    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # 1. Inference 실행 (정확도를 높이기 위해 imgsz를 640으로 고정)
        results = model(image, conf=0.3, imgsz=640) 
        
        # Process results
        detected_objects = []
        is_supplement = False
        
        print(f"\n[DEBUG] --- Inference Result Start ---")
        for r in results:
            boxes = r.boxes
            print(f"[DEBUG] Total boxes found: {len(boxes)}")
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                coords = box.xyxy[0].tolist()
                
                # [개선] 클래스별 차등 임계값 적용
                # bottle은 비교적 잘 잡히므로 0.3 이상이면 인정
                # box는 오탐지(모니터 스탠드 등)가 많으므로 0.5 이상일 때만 인정
                actual_threshold = 0.3 if label == 'bottle' else 0.55
                
                if conf >= actual_threshold:
                    print(f"[DEBUG] ✅ PASSED: {label} (conf: {conf:.2f})")
                    detected_objects.append({
                        "label": label,
                        "confidence": round(conf, 2),
                        "box": coords
                    })
                    if label in ['bottle', 'box']:
                        is_supplement = True
                else:
                    print(f"[DEBUG] ❌ REJECTED: {label} (conf: {conf:.2f}, threshold: {actual_threshold})")
        print(f"[DEBUG] --- Inference Result End ---\n")

        return {
            "is_supplement": is_supplement,
            "detected_objects": detected_objects,
            "message": "분석 완료 (Custom Model)"
        }
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}
