
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.concurrency import run_in_threadpool
from app.services.analysis_service import analyze_image
from app.services.vision_service import analyze_with_vision_api
from app.services.llm_service import extract_product_name_with_llm
import asyncio
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

@router.post("/analyze2")
async def analyze_image_vision_api(file: UploadFile = File(...)):
    """
    Google Cloud Vision API 기반 영양제 분석 엔드포인트
    (Vision API Object Detection -> Individual OCR -> LLM Refinement)
    """
    print(f"\n[API] === /ai/v1/analyze2 요청 수신 (Vision API) ===")
    print(f"[API] 파일명: {file.filename}, 컨텐츠 타입: {file.content_type}")
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
        
    try:
        image_bytes = await file.read()
        
        # 1. Vision API 분석 (객체 탐지 + 크롭 + OCR)
        raw_results = await analyze_with_vision_api(image_bytes)
        
        # 2. LLM(Gemini)을 이용한 제품명 정제 (병렬 처리)
        llm_tasks = [extract_product_name_with_llm(item.get("full_text", "")) for item in raw_results]
        llm_product_names = await asyncio.gather(*llm_tasks)
        
        # 3. Java Backend DTO 구조에 맞게 최종 결과 조합
        analysis_results = []
        for i, item in enumerate(raw_results):
            heuristic_name = item.get("product_name", "") # 기존의 크기 기반 추출 결과
            llm_name = llm_product_names[i]
            
            # LLM 결과가 있으면 사용하고, 없으면 기존 Heuristic 결과 유지
            final_product_name = llm_name if llm_name else heuristic_name
            
            analysis_results.append({
                "box": item.get("box", [0, 0, 0, 0]),
                "confidence": item.get("score", 0.0),
                "product_name": final_product_name,
                "ocr_text": item.get("full_text", "")
            })
            
        print(f"[API] === /ai/v1/analyze2 처리 완료 ===")
        return {
            "success": True,
            "message": "Vision API & LLM Analysis Successful",
            "step": "VISION_API_WITH_LLM",
            "analysis_results": analysis_results
        }
        
    except Exception as e:
        print(f"[에러] /ai/v1/analyze2 분석 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
