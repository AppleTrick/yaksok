
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
    <html>
        <head>
            <title>Yaksok AI Test</title>
        </head>
        <body style="font-family: Arial; padding: 20px;">
            <h1>🧪 API Test Page</h1>
            <p>Upload an image to test YOLO11 analysis.</p>
            <form action="/api/v1/analyze" method="post" enctype="multipart/form-data">
                <input type="file" name="file" accept="image/*" required>
                <button type="submit" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">Analyze</button>
            </form>
        </body>
    </html>
    """

app.include_router(api_router, prefix="/api/v1")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
