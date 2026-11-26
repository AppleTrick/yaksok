"""ONNX 전용 AI 서버. 외부 API 키, PyTorch, Paddle 없이 뜬다.

실행: uvicorn app.main_onnx:app --host 0.0.0.0 --port 8000
"""
import logging
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool

from app.admission import AdmissionGate, Overloaded
from app.scan.onnx_pipeline import InvalidImage, OnnxPipeline

log = logging.getLogger("yaksok.ai")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
WORKERS = int(os.environ.get("ANALYZE_WORKERS", "4"))
QUEUE = int(os.environ.get("ANALYZE_QUEUE", "8"))
WAIT_SECONDS = float(os.environ.get("ANALYZE_WAIT_SECONDS", "8"))

state = {"pipeline": None, "startup_s": None}
gate = AdmissionGate(WORKERS, QUEUE, WAIT_SECONDS)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # 모델 로드와 예열이 끝난 뒤에야 /ready 가 200이 된다 → 배포 중 콜드 스타트를 사용자가 겪지 않는다
    t = time.perf_counter()
    pipeline = OnnxPipeline()
    await run_in_threadpool(pipeline.warm_up)
    state["pipeline"], state["startup_s"] = pipeline, round(time.perf_counter() - t, 2)
    log.info("AI 서버 준비 완료: %.2f초", state["startup_s"])
    yield


app = FastAPI(title="Yaksok AI Server (ONNX)", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/live")
def live():
    return {"status": "ok"}


@app.get("/ready")
def ready():
    if state["pipeline"] is None:
        raise HTTPException(503, "준비 중")
    return {"status": "ready", "startup_s": state["startup_s"], "inside": gate.inside, "rejected": gate.rejected}


@app.post("/ai/v1/analyze3")
async def analyze3(request: Request, file: UploadFile = File(...)):
    if int(request.headers.get("content-length") or 0) > MAX_UPLOAD_BYTES + 4096:
        raise HTTPException(413, "사진은 10MB까지 올릴 수 있습니다")
    data = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "사진은 10MB까지 올릴 수 있습니다")

    arrived = time.perf_counter()
    try:
        async with gate.enter():
            waited = time.perf_counter() - arrived
            result = await run_in_threadpool(state["pipeline"].analyze, data)
    except Overloaded:
        raise HTTPException(503, "지금 분석 요청이 많습니다. 잠시 뒤 다시 시도해 주세요", headers={"Retry-After": "5"})
    except InvalidImage as e:
        raise HTTPException(400, str(e))
    except Exception:
        # 내부 오류 내용은 로그에만 남기고 사용자에게 보내지 않는다
        log.exception("분석 실패")
        raise HTTPException(500, "분석 중 오류가 발생했습니다")
    result["timings_ms"]["queue"] = round(waited * 1000)
    return result
