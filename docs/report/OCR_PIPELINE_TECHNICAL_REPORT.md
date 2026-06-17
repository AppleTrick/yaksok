# 🔬 OCR 파이프라인 기술 분석 리포트: PaddleOCR → Google Vision API

본 문서는 영양제 분석 파이프라인의 텍스트 추출 단계를 자체 호스팅 PaddleOCR에서
Google Cloud Vision API로 전환하게 된 배경과, 그 과정에서 발견된 PaddlePaddle/PaddleOCR
버전 호환성 문제를 분석한 기술 리포트입니다.

---

## 1. 🧩 배경 — 왜 PaddleOCR에서 문제가 생겼나

분석 파이프라인은 원래 `YOLO11(객체탐지) → PaddleOCR(PP-OCRv5, 텍스트 인식)` 구조였습니다.
git 히스토리를 보면 정확도를 끌어올리기 위한 수동 튜닝 시도가 길게 이어졌습니다.

```
feba652 OpenCV Grayscale/Laplacian 샤프닝/CLAHE 대비 개선/노이즈 제거
88e03e4 OCR 및 전처리 최적화 (벤포벨 로고 인식 강화)
69017ad Text-Line Recognition 고도화 (Layout Analysis)
84a8987 / 429a72f Text Denoising 적용
520da50 ai line grouping 개선
```

**YOLO와 PaddleOCR 사이에 기술적 충돌은 없습니다.** 둘은 파이프라인의 독립된 단계(YOLO가
crop → PaddleOCR이 그 crop을 읽음)일 뿐입니다. 실제 문제는 두 가지였습니다.

### 1-1. 정확도
영양제 라벨은 곡면 병/스티커에 인쇄된 작은 글씨, 장식 폰트, 로고가 혼재되어 있어 범용
PP-OCR 모델로는 한계가 있었습니다. 위 커밋 트레일(CLAHE, 샤프닝, 디워핑, denoising,
line grouping)은 이 한계를 코드로 메꾸려 한 흔적입니다. Google Vision은 훨씬 큰 데이터로
학습된 OCR이라 별도 보정 없이도 더 안정적인 결과를 줍니다.

### 1-2. 속도
`ocr_service.py`의 `PaddleOCR` 초기화 옵션을 보면 한 번의 호출에 다음 모델들이
**CPU에서 순차적으로** 실행됩니다.

```python
ocr_model = PaddleOCR(
    text_recognition_model_name="korean_PP-OCRv5_mobile_rec",
    use_doc_orientation_classify=False,
    use_doc_unwarping=True,        # 곡면 보정 모델
    use_textline_orientation=True, # 텍스트 라인 방향 감지 모델
    ...
)
```

문서 방향 분류 → 곡면 보정(UVDoc) → 텍스트 라인 방향 감지 → 텍스트 검출 → 텍스트
인식까지 GPU 없이 멀티모델 체인을 매 요청마다 도는 구조라 느릴 수밖에 없었습니다.
Vision API는 이 연산 비용이 구글 인프라로 이전되므로 서버 응답 속도가 개선됩니다.

---

## 2. 🐛 PaddlePaddle 3.0.0 / PaddleOCR 호환성 문제 — 원인 분석

OCR 서버를 새 환경에 재설치하는 과정에서 다음 에러로 모델 로드 자체가 실패하는 것을
확인했습니다.

```
[OCR 서비스] ❌ PP-OCRv5 모델 로드 실패: (InvalidArgument) Type of attribute: strides is not right.
  [Hint: Expected attributes.at("strides").dyn_cast<pir::ArrayAttribute>().at(i).isa<pir::Int32Attribute>() == true, ...]
```

### 원인
`requirements.txt`에 다음과 같이 **버전 고정 방식이 비대칭**으로 적용되어 있었습니다.

```
paddlepaddle==3.0.0     ← 정확히 고정
paddleocr>=2.9.0        ← 하한선만 있고 상한 없음
```

프로젝트를 처음 만들 때는 `paddleocr>=2.9.0`이 그 시점의 최신 버전으로 풀렸겠지만,
시간이 지난 지금 새로 `pip install`하면 **현재 최신인 paddleocr 3.7.0 + paddlex 3.7.1**이
설치됩니다. 이 최신 버전이 내려받는 모델 파일은 더 새로운 PIR(Paddle IR) 인코딩 포맷으로
export되어 있는데, **고정된 paddlepaddle 3.0.0 런타임이 이 포맷을 해석하지 못해** 위
`strides` 어트리뷰트 타입 에러가 발생했습니다.

### "그냥 paddlepaddle도 최신으로 올리면 안 되나?" — 검증 결과
실험적으로 `paddlepaddle`을 3.1.1, 3.2.2로 올려서 재시도했습니다. 결과는 모델 로드
**자체가 세그폴트로 죽었습니다.**

```
FatalError: `Segmentation fault` is detected by the operating system.
[SignalInfo: *** SIGSEGV ... ***]
```

현재 검증 환경이 **aarch64(ARM)** 인데, PaddlePaddle의 공식 ARM CPU 추론 빌드가 PIR
실행 경로에서 불안정한 것으로 보입니다. 즉 단순 버전 매칭만으로 해결되지 않는, 더 근본적인
플랫폼 이슈가 함께 얽혀 있었습니다.

### 호환 가능한 조합 (탐색 결과)
`paddlex`가 모델을 다운로드할 때 **설치된 paddle 버전에 맞는 아티팩트**를 따로
제공한다는 사실을 확인했습니다 (다운로드 URL에 `.../paddle3.0.0/...` 경로가 포함됨).
이를 근거로 버전을 역추적한 결과:

| 패키지 | 버전 | 비고 |
|---|---|---|
| `paddlepaddle` | `3.0.0` | 기존 고정값 유지 |
| `paddleocr` | `3.1.1` | `korean_PP-OCRv5_mobile_rec` 모델을 지원하는 최소 버전 (3.0.x는 이 모델 자체를 모름) |
| `paddlex` | `3.1.1` | paddleocr 3.1.1과 매칭, paddle3.0.0용 모델 아티팩트 제공 |

이 조합으로 **모델 로드는 성공**했습니다.

### 그런데 더 심각한 문제 — 추론 시점 세그폴트
모델 로드 성공 후 실제 이미지로 `predict()`를 호출하면, **로드 때와는 다른 지점에서
또 세그폴트가 발생**하며 **uvicorn 서버 프로세스 전체가 죽었습니다.**

```
INFO: 127.0.0.1 - "POST /ai/v1/analyze HTTP/1.1"
0: 640x480 1 supplement, 1815.9ms   ← YOLO는 정상 완료
FatalError: `Segmentation fault` is detected by the operating system.
[SignalInfo: *** SIGSEGV (@0x0) received by PID 556777 ... ***]
```

이는 단순히 "OCR 결과가 비어 나오는" 기존 증상보다 **훨씬 심각한 회귀**입니다 — OCR
요청 한 번에 같은 프로세스에서 동작하는 `/ai/v1/analyze2`(정상 동작하는 Google Vision
경로)까지 함께 다운됩니다.

`docker-compose.yml` / `Jenkinsfile`에는 빌드 아키텍처가 명시되어 있지 않아, 실제 운영
서버가 x86_64인지 ARM인지 이 분석만으로는 확정할 수 없었습니다. **x86_64 환경에서는
PaddlePaddle의 추론 빌드가 훨씬 성숙해 이 세그폴트가 재현되지 않을 가능성이 높지만,
운영 서버도 ARM이라면 위 버전 조합을 그대로 배포 시 서버가 통째로 죽는 회귀가 발생합니다.**

---

## 3. 🛠 PaddleOCR을 계속 썼다면 어떻게 했어야 했나

- **버전을 `>=`가 아니라 정확히 고정**(`paddleocr==X.Y.Z`, `paddlex==X.Y.Z`)하고, 실제
  동작 확인된 조합을 `pip freeze`로 lock해야 함. 하한만 있는 의존성은 시간이 지나면
  반드시 깨짐 (이번 사고의 직접 원인).
- **ONNX export + onnxruntime 추론** — PaddleOCR 배포 시 흔히 쓰이는 우회법. PIR
  포맷 변경이나 네이티브 빌드(특히 ARM) 이슈를 원천적으로 피하고 플랫폼 간 호환성도
  훨씬 안정적임.
- **속도 개선**: `use_doc_unwarping=True`는 YOLO가 이미 깔끔하게 crop한 영역엔 과한
  연산일 가능성이 높음 — 끄거나 조건부로만 적용.
- **정확도 개선**: 범용 모델 대신, YOLO를 `DataPipeLine/Main_Pipeline`에서 커스텀
  데이터로 학습했던 것처럼, 실제 영양제 라벨 crop 데이터로 PP-OCR 인식 모델을
  파인튜닝하면 더 근본적인 개선이 가능했을 것 (단, 데이터 수집·학습 비용이 커서
  관리형 API로 전환하는 쪽이 합리적인 선택이었을 가능성이 높음).

---

## 4. ✅ 결론 및 권장 운영 구성

- **주 경로**: `/ai/v1/analyze2` (YOLO → Google Vision Object Localization → 개별
  OCR → Gemini 제품명 정제). 본 분석 과정에서 실제 이미지로 끝까지 검증 완료, 정상
  동작.
- **`/ai/v1/analyze`(YOLO + 로컬 PaddleOCR) 경로는 운영 아키텍처 확인 전까지 위험
  요소로 간주할 것.** 위 표의 버전 조합(`paddleocr==3.1.1`, `paddlex==3.1.1`,
  `paddlepaddle==3.0.0`)은 모델 *로드* 문제는 해결하지만, ARM 환경에서는 *추론*
  단계에서 서버 프로세스를 통째로 죽이는 세그폴트가 확인되었음.
- 운영 서버 아키텍처(x86_64 vs ARM)를 먼저 확인하고, x86_64가 확정되기 전까지는
  `/ai/v1/analyze` 경로를 비활성화하거나 별도 프로세스/컨테이너로 격리하는 것을
  권장함 (세그폴트가 Vision API 경로까지 같이 끌고 내려가지 않도록).

이 문서는 코드 변경 없이, 위 분석 과정에서 실제로 관찰한 에러 로그와 실험 결과만을
근거로 작성되었습니다.
