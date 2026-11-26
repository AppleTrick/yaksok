"""Version3.pt → Version3.onnx. 개발 PC에서 한 번만 돌린다 (ultralytics 필요, 서버에는 필요 없음)."""
from ultralytics import YOLO
YOLO("model/Version3.pt").export(format="onnx", imgsz=640, opset=17)
