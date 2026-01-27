"""
Yaksok AI Server - 메인 애플리케이션

영양제 이미지 분석을 위한 FastAPI 서버입니다.
분석 파이프라인: YOLO 객체탐지 → 바코드 인식 → OCR 텍스트 추출
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
    description="영양제 이미지 분석 API (YOLO + 바코드 + OCR)",
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
        "features": ["YOLO 객체탐지", "바코드 인식", "한국어 OCR (PP-OCRv5)"]
    }


@app.post("/analyze")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    """
    영양제 이미지 종합 분석 엔드포인트
    
    분석 순서:
    1. YOLO로 영양제 객체 탐지
    2. 바코드 탐지 및 DB 조회 시도
    3. OCR로 텍스트 추출
    
    Returns:
        분석 결과 (YOLO 탐지 결과 + 바코드 정보 + OCR 텍스트)
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


# ============================================================
# 테스트 페이지
# ============================================================

@app.get("/test", response_class=HTMLResponse)
async def read_test_page():
    """
    브라우저에서 직접 테스트할 수 있는 웹 페이지
    YOLO 탐지 + 바코드 + OCR 결과를 시각적으로 확인 가능
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
            .card-barcode { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
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
            <p class="subtitle">영양제 이미지를 업로드하면 YOLO + 바코드 + OCR 분석 결과를 확인할 수 있습니다</p>
            
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
                <p style="font-size: 0.9rem; color: #999; margin-top: 10px;">YOLO → 바코드 → OCR 순서로 진행 중</p>
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
                
                // 바코드 결과 (개별 객체별 상세 정보 표시)
                if (data.analysis_results) {
                    const results = data.analysis_results;
                    const foundCount = results.filter(r => r.barcode && r.barcode.found).length;
                    const badge = foundCount > 0 
                        ? `<span class="badge badge-success">${foundCount}개 발견</span>`
                        : '<span class="badge badge-warning">미검출</span>';
                    
                    html += `
                        <div class="result-card card-barcode">
                            <div class="card-title">📊 2단계: 바코드 탐지 ${badge}</div>
                            ${results.length > 0 
                                ? results.map((obj, idx) => `
                                    <div style="margin-bottom: 15px; padding: 12px; background: rgba(255,255,255,0.5); border-radius: 10px; border: 1px solid rgba(0,0,0,0.05);">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                            <strong>📍 객체 #${idx + 1} (${obj.label})</strong>
                                            ${obj.barcode && obj.barcode.found 
                                                ? `<span style="color: #10b981; font-weight: bold;">${obj.barcode.data}</span>`
                                                : '<span style="color: #ef4444;">Not Found</span>'}
                                        </div>
                                        <div style="font-size: 0.85rem; color: #444;">
                                            <p>상태: ${obj.barcode ? obj.barcode.message : '분석 전'}</p>
                                            <p>시도: ${obj.barcode && obj.barcode.attempts 
                                                ? obj.barcode.attempts.map(a => `<span style="color: ${a.success ? '#10b981' : '#999'}">${a.step}${a.success ? '✅' : '❌'}</span>`).join(' → ') 
                                                : '-'}</p>
                                        </div>
                                    </div>
                                `).join('')
                                : '<p>분석할 영양제 객체가 발견되지 않았습니다</p>'
                            }
                        </div>
                    `;
                }
                
                // OCR 결과 (이제 순수하게 텍스트 정보만 표시)
                if (data.analysis_results) {
                    const results = data.analysis_results;
                    const totalOCRCount = results.reduce((sum, r) => sum + (r.ocr?.count || 0), 0);
                    const badge = totalOCRCount > 0 
                        ? `<span class="badge badge-success">텍스트 추출 완료</span>`
                        : '<span class="badge badge-warning">텍스트 없음</span>';
                    
                    html += `
                        <div class="result-card card-ocr">
                            <div class="card-title">📝 3단계: 크롭 OCR 분석 ${badge}</div>
                            ${results.length > 0 
                                ? results.map((obj, idx) => `
                                    <div style="margin-bottom: 20px; border-left: 4px solid #764ba2; padding-left: 15px;">
                                        <p style="font-weight: 600; margin-bottom: 10px; color: #764ba2;">📍 객체 #${idx + 1} 텍스트</p>
                                        ${obj.ocr && obj.ocr.count > 0 
                                            ? `<ul class="text-list">
                                                ${obj.ocr.texts.map(item => `
                                                    <li class="text-item">
                                                        <span>${item.text}</span>
                                                        <span class="confidence">${Math.round(item.confidence * 100)}%</span>
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


# ============================================================
# 라우터 등록 및 서버 실행
# ============================================================

# 기존 API 라우터 등록 (하위 호환성)
app.include_router(api_router, prefix="/ai/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
