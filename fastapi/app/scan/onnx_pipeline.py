"""YOLO(ONNX) → RapidOCR(PP-OCRv5 한국어 ONNX) → 제품명 맞추기.

YOLO가 찾는 것은 알약이 아니라 영양제 병·상자다. 찾은 것 안의 글자만 읽는다.
병을 못 찾거나 이름을 읽을 수 없으면 추측하지 않고 판별 불가로 답한다.

PyTorch도 Paddle도 올라오지 않는다. 실행기는 onnxruntime 하나라서
두 프레임워크가 OpenMP DLL을 두고 충돌하던 문제가 생기지 않는다.
"""
import io
import os
import time
from typing import List, Tuple

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps
from rapidocr import EngineType, LangDet, LangRec, ModelType, OCRVersion, RapidOCR

from app.scan.product_matcher import Line, ProductMatcher

MODEL_PATH = os.environ.get("YOLO_ONNX_PATH", os.path.join(os.path.dirname(__file__), "..", "..", "model", "Version3.onnx"))
ORT_THREADS = int(os.environ.get("ORT_THREADS", "2"))
MAX_PIXELS = 40_000_000          # 압축 폭탄 방지: 이보다 큰 사진은 풀지 않는다
MAX_SIDE = 2000                  # 긴 변을 줄여 요청마다 쓰는 메모리를 묶는다
CROP_PADDING = 15
MIN_OCR_SCORE = 0.5
# 점수가 높고 2위와도 벌어져야 이름을 확정한다. 점수만 보면 "공스킨 비타민C"를
# "공스킨 비타민D"(0.936 대 0.934)로 확정하는 일이 생겼다. 나머지는 사용자가 후보에서 고른다.
CONFIRM_SCORE = 0.6
CONFIRM_MARGIN = 0.1
# 이보다 낮으면 읽은 글자로는 제품을 알 수 없다고 보고 후보를 내지 않는다 (알약·블리스터 뒷면 등)
MIN_CANDIDATE_SCORE = 0.35
ALLOWED_FORMATS = {"JPEG", "MPO", "PNG", "WEBP"}   # MPO: 휴대폰이 JPEG 확장자로 저장하는 형식

Image.MAX_IMAGE_PIXELS = MAX_PIXELS


class InvalidImage(ValueError):
    pass


def usable(candidates: list) -> list:
    return [c for c in candidates if c["score"] >= MIN_CANDIDATE_SCORE]


def confirmed_name(candidates: list) -> str:
    if not candidates or candidates[0]["score"] < CONFIRM_SCORE:
        return ""
    if len(candidates) > 1 and candidates[0]["score"] - candidates[1]["score"] < CONFIRM_MARGIN:
        return ""
    return candidates[0]["name"]


def decode(data: bytes) -> np.ndarray:
    """파일 이름이나 Content-Type이 아니라 실제 내용으로 형식을 판단한다."""
    try:
        with Image.open(io.BytesIO(data)) as im:
            if im.format not in ALLOWED_FORMATS:
                raise InvalidImage("JPEG, PNG, WebP 사진만 분석할 수 있습니다")
            if im.width * im.height > MAX_PIXELS:
                raise InvalidImage("사진이 너무 큽니다")
            im.draft("RGB", (MAX_SIDE, MAX_SIDE))
            rgb = ImageOps.exif_transpose(im).convert("RGB")
    except InvalidImage:
        raise
    except Exception as e:
        raise InvalidImage("사진을 읽을 수 없습니다") from e
    rgb.thumbnail((MAX_SIDE, MAX_SIDE))
    return cv2.cvtColor(np.asarray(rgb), cv2.COLOR_RGB2BGR)


class OnnxPipeline:
    def __init__(self):
        options = ort.SessionOptions()
        options.intra_op_num_threads = ORT_THREADS
        self.yolo = ort.InferenceSession(MODEL_PATH, options, providers=["CPUExecutionProvider"])
        self.yolo_input = self.yolo.get_inputs()[0].name
        self.ocr = RapidOCR(params={
            "Det.engine_type": EngineType.ONNXRUNTIME, "Det.lang_type": LangDet.CH,
            "Det.model_type": ModelType.MOBILE, "Det.ocr_version": OCRVersion.PPOCRV5,
            "Rec.engine_type": EngineType.ONNXRUNTIME, "Rec.lang_type": LangRec.KOREAN,
            "Rec.model_type": ModelType.MOBILE, "Rec.ocr_version": OCRVersion.PPOCRV5,
            "Global.use_cls": False,
            "EngineConfig.onnxruntime.intra_op_num_threads": ORT_THREADS,
        })
        self.matcher = ProductMatcher.load()

    def warm_up(self):
        """첫 사용자가 느린 요청을 겪지 않도록 실제 연산을 한 번 돌려 둔다."""
        img = np.full((640, 640, 3), 255, np.uint8)
        cv2.putText(img, "VITAMIN C 1000", (40, 320), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 0), 4)
        self._detect(img)
        self._read(img)

    def _detect(self, img, conf=0.25, iou=0.45) -> List[Tuple[Tuple[int, int, int, int], float]]:
        h, w = img.shape[:2]
        s = 640 / max(h, w)
        nh, nw = int(round(h * s)), int(round(w * s))
        top, left = (640 - nh) // 2, (640 - nw) // 2
        canvas = np.full((640, 640, 3), 114, np.uint8)
        canvas[top:top + nh, left:left + nw] = cv2.resize(img, (nw, nh))
        x = canvas[:, :, ::-1].transpose(2, 0, 1)[None].astype(np.float32) / 255.0
        out = self.yolo.run(None, {self.yolo_input: x})[0][0]
        scores = out[4:].max(axis=0)
        keep = scores > conf
        cx, cy, bw, bh = out[:4, keep]
        boxes = np.stack([(cx - bw / 2 - left) / s, (cy - bh / 2 - top) / s, bw / s, bh / s], 1)
        picked = cv2.dnn.NMSBoxes(boxes.tolist(), scores[keep].tolist(), conf, iou)
        result = []
        for i in np.array(picked).flatten():
            x0, y0, bw_, bh_ = boxes[i]
            box = (int(max(0, x0)), int(max(0, y0)), int(min(w, x0 + bw_)), int(min(h, y0 + bh_)))
            if box[2] > box[0] and box[3] > box[1]:
                result.append((box, float(scores[keep][i])))
        return sorted(result, key=lambda r: -r[1])

    def _ocr(self, img):
        r = self.ocr(img)
        if not r.txts:
            return []
        return [(Line(t, float(c), float(np.linalg.norm(np.array(b[3]) - np.array(b[0])))), np.array(b, dtype=float))
                for t, c, b in zip(r.txts, r.scores, r.boxes) if c >= MIN_OCR_SCORE]

    @staticmethod
    def _quality(items) -> float:
        return sum(line.score * len(line.text) for line, _ in items if line.score >= 0.8)

    def _read(self, img):
        """똑바로 읽어 보고, 거의 못 읽었을 때만 옆으로 돌려 다시 읽는다."""
        h, w = img.shape[:2]
        best = self._ocr(img)
        if self._quality(best) >= 25:
            return best
        for code in (cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_90_COUNTERCLOCKWISE):
            items = self._ocr(cv2.rotate(img, code))
            if self._quality(items) > self._quality(best) * 1.3:
                best = [(line, self._unrotate(quad, code, w, h)) for line, quad in items]
        return best

    @staticmethod
    def _unrotate(quad, code, w, h):
        x, y = quad[:, 0].copy(), quad[:, 1].copy()
        if code == cv2.ROTATE_90_CLOCKWISE:
            return np.stack([y, h - x], 1)
        return np.stack([w - y, x], 1)

    def analyze(self, data: bytes) -> dict:
        t0 = time.perf_counter()
        img = decode(data)
        h, w = img.shape[:2]
        t1 = time.perf_counter()
        detections = self._detect(img)
        t2 = time.perf_counter()

        results, ocr_s, match_s = [], 0.0, 0.0

        def add(box: tuple, conf: float, items, dx: int, dy: int):
            nonlocal match_s
            t = time.perf_counter()
            candidates = usable(self.matcher.match([line for line, _ in items]))
            match_s += time.perf_counter() - t
            x0, y0, x1, y1 = box
            results.append({
                "box": [x0 / w, y0 / h, x1 / w, y1 / h],
                "confidence": round(conf, 3),
                "product_name": confirmed_name(candidates),
                "ocr_text": "\n".join(line.text for line, _ in items),
                "candidates": candidates,
                "texts": [{"text": line.text, "score": round(line.score, 3),
                           "quad": [[round((px + dx) / w, 4), round((py + dy) / h, 4)] for px, py in quad]}
                          for line, quad in items],
            })

        for box, conf in detections:
            x0, y0 = max(0, box[0] - CROP_PADDING), max(0, box[1] - CROP_PADDING)
            t = time.perf_counter()
            items = self._read(img[y0:box[3] + CROP_PADDING, x0:box[2] + CROP_PADDING])
            ocr_s += time.perf_counter() - t
            add(box, conf, items, x0, y0)

        ms = lambda s: round(s * 1000)
        return {
            "success": True,
            "message": "ok" if results else "영양제 병이나 상자를 찾지 못했습니다",
            "step": "ONNX",
            "analysis_results": results,
            "timings_ms": {"decode": ms(t1 - t0), "detect": ms(t2 - t1), "ocr": ms(ocr_s), "match": ms(match_s),
                           "total": ms(time.perf_counter() - t0)},
        }
