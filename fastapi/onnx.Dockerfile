FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libgomp1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements-onnx.txt .
RUN pip install --no-cache-dir -r requirements-onnx.txt
COPY app ./app
COPY data ./data
# 모델은 저장소에 없다. tools/export_onnx.py 로 만든 model/Version3.onnx 를 빌드 전에 둔다.
COPY model/Version3.onnx ./model/Version3.onnx
# OCR 모델을 빌드할 때 받아 이미지에 굽는다 → 컨테이너가 뜰 때 내려받지 않는다 (콜드 스타트 방지)
RUN python -c "from app.scan.onnx_pipeline import OnnxPipeline; OnnxPipeline().warm_up()"
RUN useradd --create-home app
USER app
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s CMD python -c "import urllib.request as u; u.urlopen('http://127.0.0.1:8000/ready', timeout=2)"
CMD ["uvicorn", "app.main_onnx:app", "--host", "0.0.0.0", "--port", "8000"]
