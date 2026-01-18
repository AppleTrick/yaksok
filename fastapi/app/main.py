
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(title="Yaksok AI Server", version="1.0.0")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.responses import HTMLResponse

@app.get("/")
def read_root():
    return {"message": "Welcome to Yaksok AI Server (YOLO11)"}

@app.get("/test", response_class=HTMLResponse)
async def read_test_page():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Yaksok AI Test</title>
        <style>
            body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: #f9f9fb; }
            h1 { color: #111827; }
            .container { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .preview-area { position: relative; margin-top: 20px; display: inline-block; }
            #imagePreview { max-width: 100%; display: block; border-radius: 8px; }
            canvas { position: absolute; top: 0; left: 0; pointer-events: none; }
            pre { background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 8px; overflow-x: auto; margin-top: 20px; }
            button { background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 1rem; margin-top: 10px; }
            button:hover { background: #1d4ed8; }
            input[type="file"] { margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧪 Yaksok AI Object Detection Test</h1>
            <p>이미지를 업로드하면 YOLO11 분석 결과와 바운딩 박스를 보여줍니다.</p>
            
            <input type="file" id="fileInput" accept="image/*">
            <button onclick="uploadAndAnalyze()">분석하기 (Analyze)</button>

            <div id="resultSection" style="display:none;">
                <h3>📸 Analysis Result</h3>
                <div class="preview-area">
                    <img id="imagePreview" />
                    <canvas id="overlay"></canvas>
                </div>
                
                <h3>📊 JSON Response</h3>
                <pre id="jsonOutput"></pre>
            </div>
        </div>

        <script>
            async function uploadAndAnalyze() {
                const fileInput = document.getElementById('fileInput');
                const file = fileInput.files[0];
                if (!file) {
                    alert("이미지를 선택해주세요.");
                    return;
                }

                // 1. Preview Image
                const img = document.getElementById('imagePreview');
                const resultSection = document.getElementById('resultSection');
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    img.src = e.target.result;
                    img.onload = () => {
                        // Reset canvas matching image size
                        const canvas = document.getElementById('overlay');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height); // clear previous
                        
                        // 2. Send to API
                        sendToApi(file, img.width, img.height);
                    }
                    resultSection.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }

            async function sendToApi(file, imgWidth, imgHeight) {
                const formData = new FormData();
                formData.append("file", file);

                try {
                    document.getElementById('jsonOutput').textContent = "Analyzing...";
                    
                    const response = await fetch("/api/v1/analyze", {
                        method: "POST",
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    // 3. Show JSON
                    document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);
                    
                    // 4. Draw Boxes
                    drawBoxes(data.detected_objects);
                    
                } catch (error) {
                    console.error("Error:", error);
                    document.getElementById('jsonOutput').textContent = "Error: " + error.message;
                }
            }

            function drawBoxes(objects) {
                const canvas = document.getElementById('overlay');
                const ctx = canvas.getContext('2d');
                const img = document.getElementById('imagePreview');
                
                // Original image natural dimensions vs Display dimensions
                // Since canvas matches img display size (width/height set in onload),
                // But YOLO returns coords based on NATURAL image size? 
                // Wait, if we send the file, YOLO processes the full resolution.
                // We need to scale coordinates if the image is displayed smaller or larger.
                
                // However, in this simple script, let's assume img.width gets set to display width.
                // Actually, HTMLImgElement.width is the rendered width.
                // YOLO returns coordinates based on the original file dimensions.
                
                const scaleX = img.width / img.naturalWidth;
                const scaleY = img.height / img.naturalHeight;

                ctx.lineWidth = 3;
                ctx.font = "16px Arial";

                objects.forEach(obj => {
                    const [x1, y1, x2, y2] = obj.box;
                    
                    // Scale coordinates
                    const sx1 = x1 * scaleX;
                    const sy1 = y1 * scaleY;
                    const sx2 = x2 * scaleX;
                    const sy2 = y2 * scaleY;
                    const w = sx2 - sx1;
                    const h = sy2 - sy1;

                    // Draw Rect
                    ctx.strokeStyle = "#00ff00"; // Green
                    ctx.strokeRect(sx1, sy1, w, h);
                    
                    // Draw Label
                    ctx.fillStyle = "#00ff00";
                    ctx.fillRect(sx1, sy1 - 25, ctx.measureText(obj.label).width + 10, 25);
                    
                    ctx.fillStyle = "black";
                    ctx.fillText(`${obj.label} ${Math.floor(obj.confidence * 100)}%`, sx1 + 5, sy1 - 7);
                });
            }
        </script>
    </body>
    </html>
    """

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
