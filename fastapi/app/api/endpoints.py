
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from app.services.analysis_service import analyze_image
import json

router = APIRouter()

def make_json_serializable(obj):
    """NumPy 타입 등을 JSON 직렬화 가능한 타입으로 변환"""
    import numpy as np
    try:
        if obj is None:
            return None
        elif isinstance(obj, dict):
            return {k: make_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [make_json_serializable(item) for item in obj]
        elif isinstance(obj, tuple):
            return [make_json_serializable(item) for item in obj]
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.int8, np.int16, np.int32, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.float16, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, np.bool_):
            return bool(obj)
        elif isinstance(obj, bytes):
            return obj.decode('utf-8', errors='replace')
        elif isinstance(obj, (str, int, float, bool)):
            return obj
        else:
            # 알 수 없는 타입은 문자열로 변환
            return str(obj)
    except Exception as e:
        print(f"[JSON 직렬화 오류] {type(obj)}: {e}")
        return str(obj)

@router.post("/analyze")
async def analyze_supplement(file: UploadFile = File(...)):
    print(f"[DEBUG] Received analysis request: {file.filename}, type: {file.content_type}")
    
    if not file.content_type.startswith("image/"):
        print(f"[DEBUG] Rejected request: Not an image ({file.content_type})")
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read file content
        contents = await file.read()
        print(f"[DEBUG] File read successfully, size: {len(contents)} bytes")
        
        # Analyze using AI Service (비동기 실행으로 블로킹 방지)
        result = await run_in_threadpool(analyze_image, contents)
        print(f"[DEBUG] Analysis success: {result.keys() if hasattr(result, 'keys') else 'No keys'}")
        
        # JSON 직렬화 안전 처리
        try:
            safe_result = make_json_serializable(result)
            print(f"[DEBUG] JSON serialization complete")
            return JSONResponse(content=safe_result)
        except Exception as json_err:
            print(f"[DEBUG] JSON serialization error: {json_err}")
            import traceback
            traceback.print_exc()
            # 직접 dict 반환 시도
            return result
    except Exception as e:
        print(f"[DEBUG] Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
