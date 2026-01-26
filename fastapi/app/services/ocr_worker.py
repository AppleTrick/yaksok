import sys
import json
import os

# ========================================================
# [핵심 해결책] DLL 충돌 방지 (순서가 생명입니다)
# ========================================================
# 1. PyTorch를 가장 먼저 불러와서 shm.dll 에러를 방지합니다.
#    (Paddle이 켜지기 전에 Torch가 먼저 시스템 자원을 확보해야 함)
try:
    import torch
except ImportError:
    pass

# 2. OpenMP 중복 에러 방지 (KMP_DUPLICATE_LIB_OK)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# 3. Paddle 최적화 설정
os.environ["FLAGS_enable_pir_api"] = "0"
os.environ["FLAGS_use_mkldnn"] = "1"

# 4. Paddle 강제 설정
import paddle
try:
    paddle.set_flags({'FLAGS_enable_pir_api': 0})
except Exception:
    pass

from paddleocr import PaddleOCR

# ========================================================
# OCR 설정 및 실행
# ========================================================
# 최신 버전 호환성을 위해 불필요한 옵션 제거
ocr = PaddleOCR(
    use_textline_orientation=True, 
    lang='korean'
)

def run_ocr(image_path: str) -> dict:
    try:
        # 이미지 경로만 넣어서 실행
        result = ocr.ocr(image_path)
        
        texts = []
        if result and result[0]:
            for line in result[0]:
                box = line[0]
                text = line[1][0]
                confidence = float(line[1][1])
                
                texts.append({
                    "text": text,
                    "confidence": round(confidence, 2),
                    "box": box
                })
        
        return {
            "success": True,
            "texts": texts,
            "count": len(texts)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "texts": []
        }

if __name__ == "__main__":
    # 한글 깨짐 방지
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8')

    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No image path provided"}, ensure_ascii=True))
        sys.exit(1)

    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(json.dumps({"success": False, "error": f"File not found: {image_path}"}, ensure_ascii=True))
        sys.exit(1)

    result = run_ocr(image_path)
    print(json.dumps(result, ensure_ascii=True))