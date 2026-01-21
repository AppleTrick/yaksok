
import io
from PIL import Image
from ultralytics import YOLO

# Initialize YOLO11 model
# STRICTLY using base model: yolo11m.pt (COCO 80 classes)
try:
    model = YOLO("yolo11m.pt")
    model_type = "Base (yolo11m.pt)"
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    model_type = "None"

def analyze_image(image_bytes: bytes) -> dict:
    """
    Analyze image using original YOLO11m (COCO).
    Returns ALL detected objects without filtering.
    """
    if model is None:
        return {"error": "Model not loaded", "is_supplement": False}

    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Inference 실행 (전체 결과를 보기 위해 임계값을 약간 낮춤)
        results = model(image, conf=0.2, imgsz=640) 
        
        # Process results
        detected_objects = []
        
        print(f"\n[DEBUG] --- Original YOLO11m (COCO) Inference Start ---")
        for r in results:
            boxes = r.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                coords = box.xyxy[0].tolist()
                
                # 필터링 없이 무조건 추가 (병, 사람, 컵, 의자 등등 전부)
                print(f"[DEBUG] 🔍 DETECTED: {label} (conf: {conf:.2f})")
                detected_objects.append({
                    "label": label,
                    "confidence": round(conf, 2),
                    "box": coords
                })
        
        print(f"[DEBUG] Total objects found: {len(detected_objects)}")
        print(f"[DEBUG] --- Inference End ---\n")

        # 영양제 앱 전용 로직 (참고용)
        is_supplement = any(obj['label'] in ['bottle', 'cup'] for obj in detected_objects)

        return {
            "is_supplement": is_supplement,
            "detected_objects": detected_objects,
            "count": len(detected_objects),
            "message": "원초적 YOLO11m 결과 (전체 클래스 탐색)",
            "model_info": model_type
        }
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}
