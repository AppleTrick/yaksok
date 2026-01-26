
import io
from PIL import Image, ImageOps
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
        
        # EXIF 정보에 따른 회전 처리 (스마트폰 사진 대응)
        try:
            image = ImageOps.exif_transpose(image)
        except Exception as e:
            print(f"[DEBUG] EXIF 처리 중 오류 (무시됨): {e}")

        orig_width, orig_height = image.size
        
        # 가로 또는 세로가 1000px을 넘으면 리사이징
        is_resized = False
        scale_x, scale_y = 1.0, 1.0
        
        if orig_width > 1000 or orig_height > 1000:
            # thumbnail은 비율을 유지하면서 주어진 (W, H) 안에 들어오도록 크기 조정
            image.thumbnail((1000, 1000))
            new_width, new_height = image.size
            
            # 스케일 비율 계산 (원본 / 리사이즈후)
            scale_x = orig_width / new_width
            scale_y = orig_height / new_height
            is_resized = True
            print(f"[DEBUG] 이미지 리사이징 수행: {orig_width}x{orig_height} -> {new_width}x{new_height}")

        # Inference 실행
        # imgsz는 YOLO 내부 입력 크기이며, 실제 이미지 크기와 상관없이 모델 규격에 맞게 조정됨
        results = model(image, conf=0.01, imgsz=640) 
        
        # Process results
        detected_objects = []
        THRESHOLD = 0.3 # 사용자 설정 임계값
        
        print(f"\n[DEBUG] === Version3.pt 상세 분석 시작 ===")
        print(f"[DEBUG] 현재 임계값(Threshold): {THRESHOLD}")
        if is_resized:
            print(f"[DEBUG] 좌표 복구 스케일링 적용 중 (x: {scale_x:.4f}, y: {scale_y:.4f})")
        
        for r in results:
            boxes = r.boxes
            if len(boxes) == 0:
                print(f"[DEBUG] ⚠️ 탐지된 객체가 아예 없습니다 (Confidence > 0.01 기준)")
                
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                label = model.names[cls_id]
                coords = box.xyxy[0].tolist() # [x1, y1, x2, y2]
                
                # 리사이징된 경우 좌표를 원본 크기로 복구
                if is_resized:
                    coords = [
                        coords[0] * scale_x,
                        coords[1] * scale_y,
                        coords[2] * scale_x,
                        coords[3] * scale_y
                    ]
                
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
            "message": "Custom 영양제 탐지 모델 결과" + (" (리사이징 적용)" if is_resized else ""),
            "model_info": model_type,
            "original_size": {"width": orig_width, "height": orig_height},
            "processed_size": {"width": image.width, "height": image.height},
            "is_resized": is_resized
        }
    except Exception as e:
        print(f"Error analyzing image: {e}")
        return {"error": str(e), "is_supplement": False}