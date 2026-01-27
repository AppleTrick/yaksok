
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analysis_service import analyze_image

router = APIRouter()

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
        
        # Analyze using AI Service
        result = analyze_image(contents)
        print(f"[DEBUG] Analysis success: {result.keys() if hasattr(result, 'keys') else 'No keys'}")
        
        return result
    except Exception as e:
        print(f"[DEBUG] Analysis error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
