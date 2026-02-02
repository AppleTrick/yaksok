"""
Yaksok AI Server - 메인 애플리케이션

영양제 이미지 분석을 위한 FastAPI 서버입니다.
분석 파이프라인: YOLO 객체탐지 -> OCR 텍스트 추출
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.concurrency import run_in_threadpool
from app.api.endpoints import router as api_router
from app.services.analysis_service import analyze_supplement
import asyncio
from app.utils import clean_save_image_directory

# ============================================================
# FastAPI 앱 초기화
# ============================================================

app = FastAPI(
    title="Yaksok AI Server",
    description="영양제 이미지 분석 API (YOLO + OCR)",
    version="2.0.0"
)

# CORS 미들웨어 설정 (프론트엔드 연동용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: 운영 환경에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 백그라운드 작업 및 수명 주기 관리
# ============================================================

async def periodic_cleanup():
    """30분마다 오래된 이미지를 정리하는 백그라운드 루프"""
    while True:
        await asyncio.sleep(1800) # 30분
        try:
            # 60분 이상 된 파일 정리
            clean_save_image_directory(max_age_minutes=60)
        except Exception as e:
            print(f"[백그라운드] 정리 작업 중 오류: {e}")

@app.on_event("startup")
async def startup_event():
    """서버 시작 시 실행되는 로직"""
    print("[서버] 🚀 Yaksok AI Server 기동 중...")
    
    # 1. 시작 시 SaveImage 폴더 전체 비우기 (README.md 제외)
    try:
        clean_save_image_directory(max_age_minutes=0)
    except Exception as e:
        print(f"[서버] 시작 시 정리 작업 실패: {e}")
        
    # 2. 주기적 정리 백그라운드 태스크 시작
    asyncio.create_task(periodic_cleanup())

# ============================================================
# API 엔드포인트
# ============================================================

@app.get("/")
def read_root():
    """서버 상태 확인용 루트 엔드포인트"""
    return {
        "message": "Yaksok AI Server가 정상 동작 중입니다",
        "version": "2.0.0",
        "features": ["YOLO 객체탐지", "한국어 OCR (PP-OCRv5)"]
    }



@app.post("/analyze")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """
    영양제 이미지 종합 분석 엔드포인트
    
    분석 순서:
    1. YOLO로 영양제 객체 탐지
    2. OCR로 텍스트 추출
    
    Returns:
        분석 결과 (YOLO 탐지 결과 + OCR 텍스트)
    """
    # 이미지 형식 검증
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
    
    try:
        image_bytes = await file.read()
        
        # CPU 집약적 작업을 스레드풀에서 실행 (비동기 블로킹 방지)
        result = await run_in_threadpool(analyze_supplement, image_bytes)
        
        return result
        
    except Exception as e:
        print(f"[에러] 분석 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}")


from app.services.vision_service import analyze_with_vision_api

@app.post("/v1/analyze2")
async def analyze_image_vision_api(file: UploadFile = File(...)):
    """
    Google Cloud Vision API 기반 영양제 분석 엔드포인트
    
    [Logic Workflow]
    1. Object Localization: 'Bottle', 'Container', 'Packaged goods' 탐지
    2. Image Cropping: 탐지된 객체 영역 Crop
    3. Individual OCR: 각 Crop 이미지에 대해 Document Text Detection 수행
    4. Heuristic Extraction: 제품명 추론
    
    Returns:
        List[Dict]: 각 객체별 분석 결과 리스트 (ID, 신뢰도, 제품명, 전체 텍스트)
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
        
    try:
        image_bytes = await file.read()
        
        # vision_service의 비동기 함수 호출
        # 내부적으로 스레드풀을 사용하여 비동기 처리됨
        raw_results = await analyze_with_vision_api(image_bytes)
        
        # Java Backend DTO (FastApiAnalysisResult) 구조에 맞게 변환
        analysis_results = []
        for item in raw_results:
            analysis_results.append({
                "box": item.get("box", [0, 0, 0, 0]),
                "confidence": item.get("score", 0.0),
                "product_name": item.get("product_name", ""),
                "ocr_text": item.get("full_text", "")
            })
            
        return {
            "success": True,
            "message": "Vision API Analysis Successful",
            "step": "VISION_API",
            "analysis_results": analysis_results
        }
        
    except Exception as e:
        print(f"[에러] Vision API 분석 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=f"Vision API 분석 중 오류가 발생했습니다: {str(e)}")


# ============================================================
# 테스트 페이지
# ============================================================

@app.get("/test", response_class=HTMLResponse)
async def read_test_page():
    """
    브라우저에서 직접 테스트할 수 있는 웹 페이지
    YOLO 탐지 + OCR 결과를 시각적으로 확인 가능
    """
    return """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yaksok AI 테스트</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 40px 20px;
            }
            .container {
                max-width: 900px;
                margin: 0 auto;
                background: white;
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
                text-align: center;
                color: #333;
                margin-bottom: 10px;
                font-size: 2rem;
            }
            .subtitle {
                text-align: center;
                color: #666;
                margin-bottom: 30px;
            }
            .upload-area {
                border: 3px dashed #ddd;
                border-radius: 15px;
                padding: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                margin-bottom: 20px;
            }
            .upload-area:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }
            .upload-area.dragover {
                border-color: #667eea;
                background: #eef0ff;
            }
            input[type="file"] { display: none; }
            .btn {
                display: inline-block;
                padding: 15px 40px;
                border: none;
                border-radius: 10px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            .btn-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4); }
            .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
            
            .result-section { margin-top: 30px; display: none; }
            .preview-container { text-align: center; margin-bottom: 20px; }
            #preview { max-width: 100%; max-height: 400px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
            
            .result-card {
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
            }
            .card-yolo { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
            .card-ocr { background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); }
            .card-error { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }
            
            .card-title {
                font-size: 1.2rem;
                font-weight: 700;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            .badge-success { background: #10b981; color: white; }
            .badge-warning { background: #f59e0b; color: white; }
            .badge-error { background: #ef4444; color: white; }
            
            .text-list { list-style: none; }
            .text-item {
                background: rgba(255,255,255,0.7);
                padding: 10px 15px;
                border-radius: 8px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .confidence { color: #666; font-size: 0.85rem; }
            
            .loading {
                text-align: center;
                padding: 40px;
                color: #667eea;
                font-weight: 600;
            }
            .loading .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid #eee;
                border-top-color: #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            
            .json-output {
                background: #1e293b;
                color: #e2e8f0;
                padding: 20px;
                border-radius: 10px;
                overflow-x: auto;
                font-family: 'Consolas', monospace;
                font-size: 0.85rem;
                margin-top: 20px;
                max-height: 300px;
            }
            
            .processing-info {
                background: #f1f5f9;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
                font-size: 0.9rem;
                color: #475569;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧪 Yaksok AI 분석 테스트</h1>
            <p class="subtitle">영양제 이미지를 업로드하면 YOLO + OCR 분석 결과를 확인할 수 있습니다</p>
            
            <div class="upload-area" id="uploadArea" onclick="document.getElementById('fileInput').click()">
                <p style="font-size: 3rem; margin-bottom: 10px;">📷</p>
                <p style="font-size: 1.1rem; color: #333;">클릭하거나 이미지를 드래그하세요</p>
                <p style="color: #999; margin-top: 5px;" id="fileName">선택된 파일 없음</p>
            </div>
            <input type="file" id="fileInput" accept="image/*">
            
            <div style="text-align: center;">
                <button class="btn btn-primary" id="analyzeBtn" onclick="analyzeImage()" disabled>
                    🚀 분석 시작
                </button>
            </div>
            
            <div id="loading" class="loading" style="display: none;">
                <div class="spinner"></div>
                <p>이미지를 분석하고 있습니다...</p>
                <p style="font-size: 0.9rem; color: #999; margin-top: 10px;">YOLO → OCR 순서로 진행 중</p>
            </div>
            
            <div class="result-section" id="resultSection">
                <div class="preview-container">
                    <img id="preview" src="" alt="미리보기">
                </div>
                
                <div id="resultCards"></div>
                
                <details style="margin-top: 20px;">
                    <summary style="cursor: pointer; font-weight: 600; color: #666;">📊 전체 JSON 응답 보기</summary>
                    <pre class="json-output" id="jsonOutput"></pre>
                </details>
            </div>
        </div>
        
        <script>
            const fileInput = document.getElementById('fileInput');
            const uploadArea = document.getElementById('uploadArea');
            const analyzeBtn = document.getElementById('analyzeBtn');
            
            // 파일 선택 이벤트
            fileInput.addEventListener('change', function() {
                if (this.files[0]) {
                    document.getElementById('fileName').textContent = this.files[0].name;
                    analyzeBtn.disabled = false;
                    
                    // 미리보기
                    const reader = new FileReader();
                    reader.onload = e => document.getElementById('preview').src = e.target.result;
                    reader.readAsDataURL(this.files[0]);
                }
            });
            
            // 드래그 앤 드롭
            uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
            uploadArea.addEventListener('drop', e => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                if (e.dataTransfer.files[0]) {
                    fileInput.files = e.dataTransfer.files;
                    fileInput.dispatchEvent(new Event('change'));
                }
            });
            
            // 분석 실행
            async function analyzeImage() {
                const file = fileInput.files[0];
                if (!file) return;
                
                document.getElementById('loading').style.display = 'block';
                document.getElementById('resultSection').style.display = 'none';
                analyzeBtn.disabled = true;
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    const response = await fetch('/analyze', { method: 'POST', body: formData });
                    const data = await response.json();
                    
                    renderResults(data);
                    document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);
                    document.getElementById('resultSection').style.display = 'block';
                } catch (error) {
                    alert('분석 중 오류가 발생했습니다: ' + error.message);
                } finally {
                    document.getElementById('loading').style.display = 'none';
                    analyzeBtn.disabled = false;
                }
            }
            
            // 결과 렌더링
            function renderResults(data) {
                const container = document.getElementById('resultCards');
                let html = '';
                
                // YOLO 결과
                if (data.yolo) {
                    const yolo = data.yolo;
                    const badge = yolo.detected 
                        ? '<span class="badge badge-success">탐지 성공</span>'
                        : '<span class="badge badge-warning">미탐지</span>';
                    
                    html += `
                        <div class="result-card card-yolo">
                            <div class="card-title">🔍 1단계: YOLO 객체탐지 ${badge}</div>
                            ${yolo.detected 
                                ? `<p>영양제 ${yolo.count}개 탐지됨</p>
                                   <ul class="text-list">
                                       ${yolo.objects.map(obj => `
                                           <li class="text-item">
                                               <span>${obj.label}</span>
                                               <span class="confidence">신뢰도: ${Math.round(obj.confidence * 100)}%</span>
                                           </li>
                                       `).join('')}
                                   </ul>`
                                : '<p>이미지에서 영양제를 찾지 못했습니다</p>'
                            }
                        </div>
                    `;
                }
                
                // OCR 결과 (이제 순수하게 텍스트 정보만 표시)
                if (data.analysis_results) {
                    const results = data.analysis_results;
                    const totalOCRCount = results.reduce((sum, r) => sum + (r.ocr_lines?.length || 0), 0);
                    const badge = totalOCRCount > 0 
                        ? `<span class="badge badge-success">텍스트 추출 완료</span>`
                        : '<span class="badge badge-warning">텍스트 없음</span>';
                    
                    html += `
                        <div class="result-card card-ocr">
                            <div class="card-title">📝 2단계: 크롭 OCR 분석 ${badge}</div>
                            ${results.length > 0 
                                ? results.map((obj, idx) => `
                                    <div style="margin-bottom: 20px; border-left: 4px solid #764ba2; padding-left: 15px;">
                                        <p style="font-weight: 600; margin-bottom: 10px; color: #764ba2;">📍 객체 #${idx + 1} 텍스트</p>
                                        ${obj.ocr_lines && obj.ocr_lines.length > 0 
                                            ? `<ul class="text-list">
                                                ${obj.ocr_lines.map(line => `
                                                    <li class="text-item">
                                                        <span>${line.text}</span>
                                                        <span class="confidence">${Math.round(line.confidence * 100)}%</span>
                                                    </li>
                                                `).join('')}
                                               </ul>`
                                            : '<p style="color: #999; font-size: 0.9rem;">이 영역에서 추출된 텍스트가 없습니다</p>'
                                        }
                                    </div>
                                `).join('')
                                : '<p>분석할 텍스트 영역이 없습니다</p>'
                            }
                        </div>
                    `;
                }
                
                // 처리 정보
                if (data.processing_info) {
                    const info = data.processing_info;
                    html += `
                        <div class="processing-info">
                            <strong>📐 이미지 처리 정보</strong><br>
                            원본 크기: ${info.original_size?.width || '?'} x ${info.original_size?.height || '?'} px<br>
                            처리 크기: ${info.processed_size?.width || '?'} x ${info.processed_size?.height || '?'} px<br>
                            리사이징: ${info.resized ? (info.resize_type === 'upscale' ? '확대됨' : '축소됨') : '없음'}
                        </div>
                    `;
                }
                
                // 에러 처리
                if (data.error) {
                    html += `
                        <div class="result-card card-error">
                            <div class="card-title">❌ 오류 발생 <span class="badge badge-error">ERROR</span></div>
                            <p>${data.error}</p>
                        </div>
                    `;
                }
                
                container.innerHTML = html;
            }
        </script>
    </body>
    </html>
    """



@app.get("/test2", response_class=HTMLResponse)
async def read_test_page_v2():
    """
    Google Cloud Vision API 테스트 페이지
    /analyze2 엔드포인트의 결과를 시각적으로 확인합니다.
    """
    return """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google Vision API 테스트</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
                font-family: 'Pretendard', 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                min-height: 100vh;
                padding: 40px 20px;
                color: #333;
            }
            .container {
                max-width: 1000px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 24px;
                padding: 40px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.15);
                backdrop-filter: blur(10px);
            }
            h1 {
                text-align: center;
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 2.2rem;
                font-weight: 800;
            }
            .subtitle {
                text-align: center;
                color: #5d6d7e;
                margin-bottom: 40px;
                font-size: 1.1rem;
            }
            
            /* Upload Section */
            .upload-section {
                background: white;
                border: 3px dashed #bdc3c7;
                border-radius: 20px;
                padding: 60px 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            .upload-section:hover {
                border-color: #4facfe;
                background: #f0f9ff;
                transform: translateY(-2px);
            }
            .upload-icon { font-size: 4rem; margin-bottom: 20px; display: block; }
            .upload-text { font-size: 1.2rem; color: #7f8c8d; font-weight: 600; }
            input[type="file"] { display: none; }
            
            /* Buttons */
            .action-btn {
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                border: none;
                padding: 16px 40px;
                font-size: 1.1rem;
                font-weight: 700;
                border-radius: 12px;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                width: 100%;
                max-width: 300px;
                margin: 0 auto;
                display: block;
                box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3);
            }
            .action-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 15px 30px rgba(79, 172, 254, 0.4);
            }
            .action-btn:disabled {
                background: #bdc3c7;
                cursor: not-allowed;
                box-shadow: none;
                transform: none;
            }
            
            /* Loading */
            .loading {
                display: none;
                text-align: center;
                margin: 30px 0;
            }
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #4facfe;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            
            /* Results */
            .result-container {
                display: none;
                margin-top: 40px;
                animation: slideUp 0.5s ease-out;
            }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            
            .preview-box {
                text-align: center;
                margin-bottom: 30px;
                background: #2c3e50;
                padding: 20px;
                border-radius: 16px;
            }
            #previewWrapper img {
                max-width: 100%;
                max-height: 500px;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            
            /* Product Cards */
            .product-list {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }
            .product-card {
                background: white;
                border-radius: 16px;
                padding: 25px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                border: 1px solid #eef2f7;
                transition: transform 0.3s;
                position: relative;
                overflow: hidden;
            }
            .product-card:hover { transform: translateY(-5px); box-shadow: 0 15px 35px rgba(0,0,0,0.1); }
            .product-card::before {
                content: '';
                position: absolute;
                top: 0; left: 0; width: 100%; height: 6px;
                background: linear-gradient(90deg, #4facfe, #00f2fe);
            }
            
            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: start;
                margin-bottom: 15px;
            }
            .product-name {
                font-size: 1.4rem;
                font-weight: 800;
                color: #2c3e50;
                margin-bottom: 5px;
                word-break: break-word;
            }
            .object-type {
                font-size: 0.9rem;
                color: #7f8c8d;
                background: #f0f3f4;
                padding: 4px 10px;
                border-radius: 20px;
                display: inline-block;
            }
            .confidence-badge {
                background: #e8f8f5;
                color: #1abc9c;
                padding: 6px 12px;
                border-radius: 12px;
                font-weight: 700;
                font-size: 0.9rem;
            }
            
            .text-content {
                background: #f8f9fa;
                border-radius: 10px;
                padding: 15px;
                font-size: 0.9rem;
                color: #555;
                border-left: 4px solid #bdc3c7;
                max-height: 200px;
                overflow-y: auto;
                white-space: pre-wrap;
            }
            .section-label {
                font-weight: 700;
                color: #95a5a6;
                font-size: 0.8rem;
                margin-bottom: 8px;
                display: block;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .raw-json {
                background: #2d3436;
                color: #dfe6e9;
                padding: 20px;
                border-radius: 12px;
                overflow-x: auto;
                font-family: 'Consolas', monospace;
                font-size: 0.85rem;
            }
            
            .empty-state {
                text-align: center;
                padding: 40px;
                color: #7f8c8d;
                background: #f8f9fa;
                border-radius: 16px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>💊 Google Vision 분석 (v2)</h1>
            <p class="subtitle">Cloud Vision API를 활용한 고정밀 영양제 인식 및 텍스트 추출</p>
            
            <div class="upload-section" id="dropZone" onclick="document.getElementById('fileInput').click()">
                <span class="upload-icon">📸</span>
                <p class="upload-text">여기를 클릭하거나 이미지를 드래그하세요</p>
                <div id="selectedFileName" style="margin-top: 15px; color: #4facfe; font-weight: 700;"></div>
            </div>
            <input type="file" id="fileInput" accept="image/*">
            
            <button id="analyzeBtn" class="action-btn" disabled onclick="startAnalysis()">
                분석 시작하기
            </button>
            
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>Google Cloud Vision API 요청 중...</p>
                <p style="font-size: 0.9rem; color: #999;">객체 탐지 → 크롭 → OCR 분석 진행</p>
            </div>
            
            <div id="resultContainer" class="result-container">
                <div class="preview-box">
                    <div id="previewWrapper">
                        <img id="previewImg" src="" alt="Origin Image">
                    </div>
                </div>
                
                <h3 style="margin-bottom: 20px; color: #2c3e50;">💡 분석 결과</h3>
                <div id="productList" class="product-list">
                    <!-- Cards will be injected here -->
                </div>
                
                <details>
                    <summary style="cursor: pointer; padding: 10px; font-weight: 600; color: #7f8c8d;">🔧 Raw JSON Data</summary>
                    <pre id="rawJson" class="raw-json"></pre>
                </details>
            </div>
        </div>
        
        <script>
            const fileInput = document.getElementById('fileInput');
            const dropZone = document.getElementById('dropZone');
            const analyzeBtn = document.getElementById('analyzeBtn');
            const previewImg = document.getElementById('previewImg');
            
            // File Handling
            fileInput.addEventListener('change', handleFileSelect);
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#4facfe';
                dropZone.style.background = '#f0f9ff';
            });
            
            dropZone.addEventListener('dragleave', (e) => {
                dropZone.style.borderColor = '#bdc3c7';
                dropZone.style.background = 'white';
            });
            
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.style.borderColor = '#bdc3c7';
                dropZone.style.background = 'white';
                
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    handleFileSelect();
                }
            });
            
            function handleFileSelect() {
                const file = fileInput.files[0];
                if (file) {
                    document.getElementById('selectedFileName').textContent = file.name;
                    analyzeBtn.disabled = false;
                    
                    const reader = new FileReader();
                    reader.onload = (e) => previewImg.src = e.target.result;
                    reader.readAsDataURL(file);
                }
            }
            
            async function startAnalysis() {
                const file = fileInput.files[0];
                if (!file) return;
                
                // UI Update
                analyzeBtn.disabled = true;
                document.getElementById('loading').style.display = 'block';
                document.getElementById('resultContainer').style.display = 'none';
                
                const formData = new FormData();
                formData.append('file', file);
                
                try {
                    // Update URL to /v1/analyze2
                    const response = await fetch('/v1/analyze2', {
                        method: 'POST',
                        body: formData
                    });
                    
                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.detail || '분석 실패');
                    }
                    
                    const data = await response.json();
                    renderResults(data);
                    
                } catch (e) {
                    alert('에러 발생: ' + e.message);
                } finally {
                    analyzeBtn.disabled = false;
                    document.getElementById('loading').style.display = 'none';
                }
            }
            
            function renderResults(data) {
                const listEl = document.getElementById('productList');
                const jsonEl = document.getElementById('rawJson');
                
                jsonEl.textContent = JSON.stringify(data, null, 2);
                listEl.innerHTML = '';
                
                // Data structure changed: data -> data.analysis_results
                const results = data.analysis_results || [];
                
                if (results.length === 0) {
                    listEl.innerHTML = '<div class="empty-state">탐지된 영양제 객체가 없습니다.</div>';
                } else {
                    results.forEach((item, index) => {
                        const card = document.createElement('div');
                        card.className = 'product-card';
                        
                        // New fields: confidence, product_name, ocr_text
                        const productName = item.product_name || '이름 인식 불가';
                        const scorePercent = Math.round((item.confidence || 0) * 100);
                        const allText = item.ocr_text || '(추출된 텍스트 없음)';
                        
                        card.innerHTML = `
                            <div class="card-header">
                                <div>
                                    <div class="product-name">${productName}</div>
                                    <span class="object-type">Object #${index + 1}</span>
                                </div>
                                <div class="confidence-badge">${scorePercent}% 일치</div>
                            </div>
                            
                            <div>
                                <span class="section-label">OCR TEXT</span>
                                <div class="text-content">${allText}</div>
                            </div>
                        `;
                        listEl.appendChild(card);
                    });
                }
                
                document.getElementById('resultContainer').style.display = 'block';
            }
        </script>
    </body>
    </html>
    """

# ============================================================
# 라우터 등록 및 서버 실행
# ============================================================

# 기존 API 라우터 등록 (하위 호환성)
app.include_router(api_router, prefix="/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
