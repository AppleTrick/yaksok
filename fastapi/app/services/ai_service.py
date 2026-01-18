
import io
from PIL import Image
from ultralytics import YOLO

# Initialize YOLO11 Nano model
# This will download 'yolo11n.pt' on first run
model = YOLO("yolo11n.pt") 

def analyze_image(image_bytes: bytes) -> dict:
    """
    Analyze image using YOLO11.
    """
    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Run inference
        results = model(image)
        
        # Process results
        detected_objects = []
        is_supplement = False
        
        # Check first result (single image)
        for r in results:
            for box in r.boxes:
                # Get class ID and confidence
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                
                detected_objects.append({
                    "label": label,
                    "confidence": round(conf, 2),
                    "box": box.xyxy[0].tolist() # [x1, y1, x2, y2]
                })
                
                # Simple logic: If it detects 'bottle' or specific usage classes, mark as supplement
                # Note: Default COCO classes include 'bottle'. Custom training will be needed for specifics.
                if label in ['bottle', 'cup', 'bowl', 'orange', 'apple']: # broad check for now
                    is_supplement = True

        return {
            "is_supplement": is_supplement,
            "detected_objects": detected_objects,
            "message": "분석 완료"
        }
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}
