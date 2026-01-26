
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analysis_service import analyze_image

router = APIRouter()

@router.post("/analyze")
async def analyze_supplement(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    contents = await file.read()
    
    # Analyze using AI Service
    result = analyze_image(contents)
    
    return result
