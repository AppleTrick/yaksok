# AI 영양제 분석 시스템 - 기술 설계 회고록

---

## 1. 전체 시스템 아키텍처 설계

### 결정: FastAPI (AI 서버) + Spring Boot (비즈니스 서버) 분리

**무엇을 했나**

단일 서버 구조 대신 역할을 두 서버로 분리했다.

- **FastAPI**: 이미지 수신 → Google Vision API 호출 → Gemini LLM 호출 → 제품명 추출 결과 반환
- **Spring Boot**: 사용자 인증, 비즈니스 로직, DB 트랜잭션, OpenAI LLM 호출, 최종 응답 조립

```
클라이언트
  └→ Spring Boot (POST /api/v1/analyze)
        └→ FastAPI (POST /ai/v1/analyze2)  ← 이미지 전달
              └→ Google Vision API (객체 탐지 + OCR)
              └→ Gemini 2.0 Flash Lite (제품명 정제)
        ←─ 제품명 + OCR 텍스트 수신
        └→ OpenAI GPT (제품 검증 + 성분 추출 + 복용시간)
        └→ MySQL DB 저장
```

**왜 이 선택을 했나**

Python 생태계에서만 쓸 수 있는 라이브러리들(YOLO, PaddleOCR, OpenCV, PIL, scikit-image 등)을 활용하기 위해서였다. Java에서 YOLO 모델을 직접 서빙하거나 Vision API의 응답을 처리하려면 JNI 바인딩이나 ONNX Runtime 같은 추가 레이어가 필요하고, 이는 팀의 역량 범위를 벗어났다. 반면 Spring Boot는 JWT 기반 인증, JPA 트랜잭션 관리, 스케줄링 등 기존 팀이 익숙한 영역이었으므로 역할을 나눴다.

**대안으로 고려한 것**

- **단일 Spring Boot 서버**: ONNX Runtime으로 YOLO를 Java에서 실행하거나, Python 스크립트를 subprocess로 호출하는 방식. 유지보수 비용과 디버깅 난이도가 높아 제외.
- **단일 FastAPI 서버**: 인증과 DB 트랜잭션을 SQLAlchemy + FastAPI로 구현. 팀의 Spring 숙련도를 버리는 선택이라 제외.

**회고: 왜 아쉬운가**

분리 자체는 옳았지만 책임 경계를 제대로 설계하지 못했다. FastAPI가 단순히 Vision API와 Gemini를 프록시하는 역할에 그쳤는데, 이렇게 되면 FastAPI는 단독으로 존재할 이유가 약해진다. 더 나은 설계는 FastAPI를 **순수 추론 서버**로 제한하는 것이었다.

```
[AS-IS]  FastAPI = Vision API 호출 + Gemini 호출 + 결과 반환
[TO-BE]  FastAPI = (YOLO 추론 OR Vision API 호출) + Gemini 호출만
         Spring Boot = 모든 DB 접근, 비즈니스 로직, 외부 API 오케스트레이션
```

또는 FastAPI가 결과를 Kafka 메시지로 발행하고 Spring이 소비하는 **이벤트 기반 구조**로 갔다면 서버 간 동기 의존성을 끊을 수 있었다.

---

## 2. 영양제 객체 탐지: YOLO11 파인튜닝

### 결정: 사전학습 모델 대신 직접 파인튜닝

**무엇을 했나**

YOLOv11m 모델을 영양제 병 탐지 전용으로 파인튜닝했다. 학습 파라미터는 아래와 같다.

```python
# train_v3_supplement.ipynb 기준
model_size = 'm'       # YOLOv11m (Medium)
epochs     = 150
imgsz      = 640       # 학습 입력 이미지 크기
batch_size = 16
patience   = 20        # Early stopping
device     = 'GPU 0'

# 데이터 증강 설정 (Albumentations)
hsv_h   = 0.015   # 색조 변화
hsv_s   = 0.7     # 채도 변화
hsv_v   = 0.4     # 밝기 변화
degrees = 10      # 회전 ±10도
scale   = 0.5     # 크기 변화
fliplr  = 0.5     # 좌우 반전 50%
mosaic  = 1.0     # Mosaic 증강
```

**데이터 구축 과정 (V1 → V3)**

| 버전 | 데이터 수 | 핵심 변경 | 문제 |
|------|----------|----------|------|
| V1 | 520장 | Roboflow 공개 데이터 | 특정 브랜드 과적합, 낮은 정확도 |
| V2 | 1,250장 | 직접 수집 + Albumentations 증강 | 컵·텀블러를 영양제로 오인 (FP 증가) |
| V3 | 2,480장 | Hard Negative Mining + 라벨 정제 | Recall 0.730으로 낮음 |

**V3 핵심 기법 - Hard Negative Mining**

V2에서 발생한 False Positive 문제를 해결하기 위해 "영양제가 없는 이미지"를 의도적으로 학습 데이터에 포함했다. COCO 데이터셋에서 Bottle 클래스를 제외한 배경 이미지를 자동 추출하여 학습에 포함하는 스크립트를 직접 작성했다. 이 방식으로 Precision을 0.921까지 끌어올릴 수 있었다.

**라벨링 품질 관리 - Human-in-the-loop**

V2 모델로 전체 데이터를 프리라벨링한 뒤, 키보드(Y/N)로 라벨을 빠르게 승인·거부할 수 있는 검수 GUI 도구를 직접 개발하여 사용했다. 이 도구 없이 수작업으로 했다면 2,480장 전체 검수는 현실적으로 불가능했다.

**왜 이 선택을 했나**

기본 YOLO 모델(COCO 학습)은 "bottle" 클래스로 영양제를 어느 정도 잡지만, 원통형 용기 다수나 투명 케이스, 포장지 형태의 영양제는 인식하지 못했다. 운영 환경에서 사용자 섭취 기록 자동화라는 목표를 달성하려면 실제 영양제 특화 모델이 필요했다.

**대안으로 고려한 것**

- **COCO 사전학습 모델 그대로 사용**: 빠르지만 정확도 부족, 영양제 특화 클래스 없음.
- **Google Vision API 객체 탐지만 사용**: 탐지 클래스가 "Bottle", "Medicine", "Container" 수준으로 거칠고, 서버당 API 비용 발생. 결국 최종 파이프라인에서 Vision API로 교체했지만 YOLO 학습 경험 자체는 데이터 구축 역량으로 남았다.
- **YOLOv11n (Nano) 사용**: 추론 속도는 빠르지만 V1 결과에서 낮은 정확도를 확인하고 Medium으로 교체.

**트러블슈팅: 모바일 이미지 크기 불일치**

학습 이미지 크기(640×640)와 실제 스마트폰 입력 이미지(4000×3000)의 불일치로 탐지가 안 되는 케이스가 발생했다. YOLO는 입력 이미지를 모델 학습 해상도로 리사이즈하지만, 극단적인 비율 차이에서 작은 객체가 뭉개지는 현상이 있었다. 이미지 전처리 단계에 EXIF 자동 보정과 단계적 리사이즈를 추가하여 해결했다.

```python
# 이미지 전처리 로직 (적응형 리사이즈)
def 이미지_로드_및_전처리(image_bytes):
    image = Image.open(BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image)  # 스마트폰 EXIF 회전 보정
    image = image.convert("RGB")
    
    # 1000px 초과 시 다운스케일 (LANCZOS 고품질 보간)
    # 600px 미만 시 업스케일 (CUBIC 보간)
    # 스케일 팩터 반환 → 좌표 역변환에 사용
    return processed_image, scale_x, scale_y
```

**회고: Recall 0.730의 원인과 개선 방향**

Precision 0.921 대비 Recall 0.730의 차이는 특정 유형(포장지형 영양제, 투명 케이스, 소형 영양제)에서 미검출이 집중됐기 때문으로 추정된다. Hard Negative Mining으로 FP는 줄였지만 FN(미검출)은 해당 유형의 데이터 부족 문제였다. 클래스별 Recall을 분석한 뒤 낮은 클래스에 한정해 데이터를 추가 수집했어야 했다. 전체 데이터를 늘리는 것보다 타겟 클래스만 보강하는 게 더 효율적이었을 것이다.

---

## 3. OCR: PaddleOCR → Google Vision API 교체

### 결정: 자체 OCR 모델 대신 Google Vision API 사용

**무엇을 했나**

초기에 PaddleOCR(PP-OCRv5 Korean 모델)을 로컬에서 실행하여 영양제 라벨의 텍스트를 추출했다. 이후 Google Cloud Vision API의 `document_text_detection`으로 교체했다.

**왜 PaddleOCR이 실패했나**

영양제 라벨은 일반 문서 OCR과 다른 특성을 갖는다.

1. **원통형 곡면**: 텍스트가 곡면을 따라 배치되어 글자 기준선(baseline)이 직선이 아님. PaddleOCR의 텍스트 라인 그룹핑 알고리즘은 직선 기준선을 전제로 설계되어 있어 줄 단위 병합 오류 발생.
2. **글자 높이 불일치**: 영양제 라벨은 브랜드명(큰 글씨), 성분명(작은 글씨), 주의사항(극소 글씨)이 혼재. 높이 차이가 크면 같은 영역의 텍스트를 별개의 블록으로 분리하는 문제.
3. **로딩 시간**: 모델 초기화에 수 초가 소요되어 Cold Start가 길었다.
4. **정확도**: 영양제 전용 학습 데이터가 없는 일반 Korean OCR 모델로는 브랜드명 오인식이 잦았다.

**왜 Google Vision API를 선택했나**

`document_text_detection`은 단순 문자 인식을 넘어 텍스트의 공간적 배치(bounding polygon)와 신뢰도를 함께 반환한다. 곡면 라벨에서도 개별 글자 단위로 위치를 잡기 때문에 줄 병합 오류가 줄었다. 또한 추가 모델 유지 없이 API 한 번으로 해결되어 서버 메모리와 유지보수 비용 모두 절감됐다.

**대안으로 고려한 것**

- **EasyOCR**: PaddleOCR보다 설치가 간단하지만 곡면 처리 능력은 비슷한 수준. 속도도 더 느려 제외.
- **Tesseract 4.x (LSTM)**: 오래된 엔진으로 한국어 정확도가 낮음. 커스텀 학습 시 성능 개선 가능하지만 학습 데이터 구축 비용이 큼.
- **Naver CLOVA OCR**: 한국어에 특화된 API로 성능은 우수하나 당시 팀 API 키 발급 지연으로 제외.
- **자체 Fine-tuning**: 영양제 라벨 전용 OCR 모델을 학습하는 방법. 데이터 수집과 학습 시간 모두 프로젝트 일정을 초과하므로 제외.

**Google Vision 파이프라인 구현**

```
이미지
  └→ object_localization()          # Vision API: 영양제 병 위치 탐지
        ↳ 탐지 클래스 필터링: "Bottle", "Medicine", "Container" 등 7종
        ↳ IoU 기반 NMS 적용 (threshold=0.3): 중복 박스 제거
  └→ 영양제 영역 크롭               # 탐지된 영역만 잘라냄
  └→ document_text_detection()      # Vision API: 잘린 이미지에서 OCR
  └→ 제품명 후보 추출               # 가장 큰 글자 = 제품명 후보
  └→ Gemini 2.0 Flash Lite         # OCR 노이즈 정제 → 최종 제품명
```

**IoU 기반 중복 탐지 제거**

동일 영양제가 여러 클래스로 중복 탐지되는 경우를 처리했다. 신뢰도 내림차순으로 정렬 후, IoU > 0.3인 겹치는 박스를 제거하는 방식이다.

```python
# IoU 기반 중복 제거 (NMS)
def 중복_탐지_제거(objects, iou_threshold=0.3):
    # 신뢰도 내림차순 정렬
    sorted_objects = sorted(objects, key=lambda x: x.score, reverse=True)
    keep = []
    for candidate in sorted_objects:
        # 이미 선택된 박스들과 IoU 계산
        overlaps = [IoU_계산(candidate, kept) for kept in keep]
        if all(iou < iou_threshold for iou in overlaps):
            keep.append(candidate)
    return keep
```

---

## 4. LLM 호출 병렬화 및 DB 정합성 해결

### 결정: CompletableFuture 병렬 처리 + synchronized DB 저장

**무엇을 했나**

영양제 1개당 최대 3번의 OpenAI API 호출이 순차 실행되어, 영양제 4개 분석 시 최대 75초가 걸렸다. 이를 병렬 처리로 전환하여 평균 12초로 단축했다.

**호출 구조 (영양제 1개 기준)**

| 호출 | 담당 | 역할 | 조건 | 소요시간(추정) |
|------|------|------|------|-------------|
| ① | FastAPI | Gemini: OCR 텍스트 → 제품명 정제 | 항상 | ~1-2초 |
| ② | Spring | OpenAI: 제품명 실재 여부 검증 | 항상 (특정 키워드 포함 시 스킵) | ~2-3초 |
| ③ | Spring | OpenAI: 성분·함량·단위 추출 및 DB 저장 | DB에 없는 신규 제품만 | ~4-5초 |
| ④ | Spring | OpenAI: 복용 시간 추천 | 항상 (② 통과 시) | ~2-3초 |

순차 실행 시 영양제 4개 × 최대 (2+3+5+3)초 = 52초 이상, DB 저장 시간 포함 시 75초.

**병렬화 구현**

Spring의 `ThreadPoolTaskExecutor`와 `CompletableFuture`를 조합했다.

```java
// 비동기 설정 - LLM 전용 스레드 풀
@Bean(name = "llmTaskExecutor")
public Executor llmTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(2);       // 기본 유지 스레드
    executor.setMaxPoolSize(8);        // 최대 8개 영양제 동시 처리
    executor.setQueueCapacity(10);     // 큐 용량
    executor.setRejectionPolicy(new CallerRunsPolicy()); // 큐 초과 시 호출자 스레드 실행
    return executor;
}

// 영양제 N개를 CompletableFuture로 병렬 처리
List<CompletableFuture<분석결과>> futures = analysisResults.stream()
    .map(result -> CompletableFuture.supplyAsync(
        () -> 영양제단위처리(result, 현재섭취량맵), llmTaskExecutor))
    .collect(toList());

CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
```

영양제 단위 처리 내부에서도 복용시간 추천(④)을 성분 추출(③)과 **동시에** 실행한다.

```java
// 복용시간 추천(④)을 성분 추출(③)과 동시에 비동기 실행
CompletableFuture<복용시간응답> 복용시간작업 =
    CompletableFuture.supplyAsync(() -> 복용시간추천(productName), llmTaskExecutor);

// ③ 성분 추출 (DB에 없는 신규 제품일 때)
if (product == null) {
    product = 제품추출및저장(productName, ocrText);
}

// ④ 복용시간 결과 합류 (③과 병렬로 실행됐음)
복용시간응답 intakeTime = 복용시간작업.join();
```

**DB 정합성 문제와 해결**

병렬화 직후 동일 제품을 동시에 처리하는 두 스레드가 **각자 DB 조회 → 없음 확인 → 동시에 INSERT** 하는 Race Condition이 발생했다. 같은 제품이 2개 이상 저장되거나 제품-성분 연결 테이블에서 FK 오류가 터졌다.

두 가지 해결책을 비교했다.

| 방법 | 장점 | 단점 |
|------|------|------|
| **DB Unique Constraint + upsert** | 가장 안전한 방법, 애플리케이션 레이어 의존 없음 | 예외 처리 코드 증가, 제품명 정규화 선행 필요 |
| **`synchronized` 블록** | 구현이 단순하고 즉시 적용 가능 | 단일 인스턴스 환경에서만 유효 |

LLM 호출 자체는 여전히 병렬이므로 `synchronized`를 DB 저장 구간에만 적용하는 방식을 선택했다.

```java
// LLM 호출은 병렬, DB 저장 구간만 synchronized로 직렬화
private 제품엔티티 제품추출및저장(String productName, String ocrText) {
    // LLM 호출 (병렬 스레드에서 동시 실행)
    성분추출결과 result = LLM호출재시도(성분추출프롬프트, 파라미터, 3);
    
    synchronized (this) {  // DB 저장 구간만 직렬화
        // Double-checked locking: 진입 시 재조회
        제품엔티티 existing = 제품명으로조회(productName).orElse(null);
        if (existing != null) return existing;  // 이미 다른 스레드가 저장함
        
        제품엔티티 saved = 제품저장(엔티티생성(result));
        성분저장(saved, result.getIngredients());
        return saved;
    }
}
```

`synchronized` 블록 진입 후 재조회(Double-checked locking)를 통해 다른 스레드가 먼저 저장한 경우 중복 INSERT를 방지했다.

**회고: 더 나은 방법**

운영 환경이었다면 `synchronized`는 단일 인스턴스에서만 동작하므로 수평 확장(멀티 인스턴스)에서 동일한 Race Condition이 재발한다. 더 견고한 해결책은:

1. **DB Unique Constraint**: 제품명 컬럼에 Unique Index 추가 → INSERT 충돌 시 `ON DUPLICATE KEY UPDATE` 또는 예외 캐치 후 재조회.
2. **분산 락**: Redis 기반 락으로 인스턴스 간 동기화.
3. **큐 기반 처리**: LLM 결과를 큐에 넣고 단일 Consumer가 순차적으로 DB 저장.

현재 구현은 단일 인스턴스 서비스 환경에서는 정상 동작하지만, 이 한계를 인지하고 있어야 한다.

---

## 5. LLM 프롬프트 설계

### 제품 검증 프롬프트

OpenAI에 제품명이 실제 영양제인지 검증하는 프롬프트다. OCR 노이즈("오전 10시", "주의사항" 등)를 걸러내기 위한 단계다. Gemini가 1차 정제를 했어도 여전히 영양제가 아닌 텍스트가 제품명으로 들어오는 경우가 있기 때문이다.

```
temperature = 0.1  → 창의성 최소화, 일관된 판단
재시도 = 2회
```

특정 키워드(필리, 비타민, 칼슘, 마그네슘, 루테인, 오메가)가 포함된 경우 LLM 호출 없이 유효로 판단하여 API 비용을 절감했다.

### 성분 추출 프롬프트

신규 제품의 성분명·함량·단위를 추출하는 핵심 프롬프트다. 성분명 표준화 규칙을 명시했다.

```
비타민: "비타민 B1", "비타민 B2", "비타민 C", "비타민 D3"
미네랄: "칼슘", "마그네슘", "아연", "철분"
기타: "루테인", "지아잔틴", "EPA", "DHA", "오메가-3"
최소 5개 성분 추출, 잘 알려진 제품(비맥스, 센트룸)은 일반 지식 활용 허용

temperature = 1.0  → 다양한 성분 추정 허용
재시도 = 3회
```

### 복용시간 추천 프롬프트

```
AFTERMEAL(식후): 종합비타민, B군, 오메가-3 등 지용성
BEFOREMEAL(식전): 철분, 유산균
BEFORESLEEP(취침 전): 마그네슘, 칼슘

temperature = 1.0
재시도 = 2회
```

---

## 6. 최종 성능 및 수치

| 지표 | 수치 |
|------|------|
| YOLO mAP@50 | 0.814 |
| YOLO Precision | 0.921 |
| YOLO Recall | 0.730 |
| LLM 병렬화 전 분석 시간 (영양제 4개) | 최대 75초 |
| LLM 병렬화 후 분석 시간 (영양제 4개) | 평균 12초 |
| 개선율 | 약 84% 단축 |
| 영양제 1개당 최소 LLM 호출 수 | 2회 (DB 캐시 히트) |
| 영양제 1개당 최대 LLM 호출 수 | 4회 (신규 제품) |

---

## 7. AI 활용 개발 프로세스

### 개요

제품 기능에 AI를 사용하는 것과 별개로, **개발 프로세스 자체에도 AI를 체계적으로 도입**했다. 단순히 코드를 생성시키는 수준이 아니라, 작업 범위 이탈 방지·검증 가능성 확보·재현성 확보를 목표로 세 가지 워크플로우를 운영했다.

---

### 1. Plan-First Workflow + Human Approval Gate

**문제 인식**

AI에게 "이 기능 구현해줘"라고 바로 시키면 예상치 못한 파일이 바뀌거나, 기존 API 계약이 깨지거나, 테스트 없이 코드가 병합되는 상황이 생긴다. 특히 이 프로젝트처럼 FastAPI와 Spring Boot가 분리된 구조에서는 한쪽 변경이 다른 쪽에 조용히 영향을 주는 경우가 많았다.

**적용 방식**

구현 요청 전에 반드시 계획 수립 단계를 거치도록 강제했다. AI가 계획을 제출하기 전까지는 코드 생성을 승인하지 않는 규칙을 팀 내 합의로 운영했다.

계획서에 포함해야 하는 항목:

| 항목 | 목적 |
|------|------|
| 변경되는 파일 목록 | 작업 범위 명시, 예상 외 파일 변경 방지 |
| DB 스키마 영향 | 마이그레이션 필요 여부 사전 확인 |
| API 계약 영향 | FastAPI ↔ Spring Boot 인터페이스 변경 여부 |
| 필요한 테스트 | 어떤 시나리오를 검증해야 하는지 |
| 이번 작업에서 하지 말아야 할 것 | 범위 외 리팩토링·최적화 금지 항목 |

**이 프로젝트에서의 실제 효과**

LLM 병렬화 작업에서 이 방식이 효과를 발휘했다. "병렬 처리로 바꿔줘"라고 바로 시켰다면 `synchronized` 블록 없이 병렬 전환만 됐을 것이다. 계획 단계에서 "DB 저장 시 Race Condition 가능성"이 사전에 식별되었고, `synchronized`와 Double-checked locking까지 함께 설계한 후 구현에 들어갔다.

---

### 2. AI 역할 분리 (Researcher → Planner → Reviewer)

**문제 인식**

하나의 AI에게 조사·설계·구현·검증을 모두 맡기면 각 단계의 품질이 낮아진다. 구현을 맡은 AI가 스스로 자신의 코드를 검토하면 편향이 생기고, 놓친 버그를 찾기 어렵다.

**적용 방식**

작업 유형에 따라 AI의 역할을 세 가지로 분리하여 독립적으로 운영했다.

```
Researcher  → 기술 조사, 라이브러리 선택, 선례 탐색
              (예: "PaddleOCR vs Google Vision 비교 분석")

Planner     → 구현 계획 수립, 파일 영향 범위 산정, 테스트 시나리오 정의
              (예: "영양제 탐지 파이프라인 리팩토링 계획서 작성")

Reviewer    → 완성된 코드 독립 검토, 보안 취약점·엣지케이스 지적
              (예: "이 동기화 로직에서 데드락 가능성 있는지 검토")
```

Reviewer는 구현한 AI와 다른 컨텍스트에서 실행하여 구현 의도를 모르는 상태에서 코드만 보고 판단하게 했다. 이를 통해 구현자가 당연하게 여겼던 가정을 외부 시각으로 검증할 수 있었다.

**이 프로젝트에서의 실제 효과**

OCR 모듈 교체(PaddleOCR → Google Vision) 시 Researcher가 두 API의 한국어 곡면 텍스트 처리 방식 차이를 먼저 분석했고, Planner가 교체 범위(FastAPI 레이어만, Spring Boot 무변경)를 확정한 뒤 구현에 들어갔다. Reviewer가 이후 "IoU NMS 임계값이 하드코딩되어 있어 테스트 환경에서 조정이 불가"라는 점을 지적하여 설정값으로 외부화했다.

---

### 3. 프롬프트 및 작업 로그 관리

**문제 인식**

AI가 생성한 코드가 왜 그런 구조로 나왔는지 나중에 추적할 수 없으면, 버그가 발생했을 때 원인을 찾기 어렵다. 또한 같은 작업을 다시 시킬 때 매번 처음부터 설명해야 한다.

**적용 방식**

- **프롬프트 버전 관리**: 주요 작업에 사용한 프롬프트를 문서로 보관하여 재현 가능성 확보
- **작업 훅 로그**: AI 도구 실행 전·후 로그를 기록하여 어떤 파일이 언제 어떤 이유로 변경됐는지 추적
- **결정 근거 기록**: 특정 구현 방식을 선택한 이유를 코드 주석이 아니라 작업 문서에 남겨 코드 리뷰 시 맥락 공유

**이 프로젝트에서의 실제 효과**

YOLO 학습 파이프라인에서 V2 → V3로 전환할 때 "왜 Hard Negative Mining을 선택했는가", "어떤 프롬프트로 데이터셋 구성을 설계했는가"를 로그로 남겨뒀기 때문에 팀원 간 맥락 공유 없이도 설계 의도를 파악할 수 있었다.

---

### 4. AI 실무 활용 인프라 구축

**문제 인식**

워크플로우 규칙만으로는 충분하지 않았다. AI가 매 세션을 새로 시작할 때마다 프로젝트 컨텍스트, 코딩 규칙, 허용 범위를 다시 설명해야 했다. 반복 설명 없이도 AI가 일관되게 동작하려면 규칙을 문서화하고 구조적으로 강제하는 인프라가 필요했다.

**구축한 인프라**

**① CLAUDE.md — AI 행동 계약서**

프로젝트 루트에 `CLAUDE.md`를 두고 AI가 코딩 세션을 시작할 때마다 로드하도록 했다. 네 가지 핵심 원칙을 명시했다.

| 원칙 | 내용 |
|------|------|
| Think Before Coding | 구현 전 가정을 명시적으로 서술. 불확실하면 묻고, 더 단순한 방법이 있으면 먼저 제안 |
| Simplicity First | 요청된 것만 구현. 투기적 추상화·불필요한 유연성 추가 금지 |
| Surgical Changes | 요청한 부분만 수정. 인접 코드·포맷·주석을 이유 없이 건드리지 않음 |
| Goal-Driven Execution | 성공 기준을 검증 가능한 형태로 정의하고, 기준이 충족될 때까지 반복 |

**② 프롬프트 금고 (Prompt Vault)**

효과적이었던 프롬프트를 매번 새로 작성하는 비효율을 없애기 위해, 프롬프트를 수집·버전 관리·재사용하는 전용 웹 애플리케이션을 직접 구축했다. Next.js + SQLite + Prisma로 만든 이 도구는 프롬프트를 타입별로 분류하고, 민감한 프롬프트는 AES-256-CBC로 암호화해 저장한다. 개발 과정에서 성과를 낸 프롬프트는 즉시 보관되어 팀 내 재사용 자산이 됐다.

**③ 프로젝트별 AI 권한 제어**

AI 에이전트가 실행할 수 있는 쉘 명령어를 프로젝트별로 명시적으로 제한했다. 백엔드 서버 프로젝트에서는 빌드 실행 명령 외의 쉘 접근을 차단했다. AI가 의도치 않게 DB를 초기화하거나 빌드 산출물을 삭제하는 사고를 구조적으로 방지한다.

**④ 문서 기반 개발 (Documentation-First)**

AI가 코딩 세션에서 참조할 문서를 사전에 정비하고 `CLAUDE.md`에 링크로 등록했다. 기술 스택 문서, 디자인 레퍼런스, 코딩 컨벤션, 커밋 컨벤션이 각각 별도 파일로 유지된다. AI는 코드를 작성하기 전에 이 문서들을 읽고 프로젝트의 현재 상태에서 판단하도록 강제된다. 구조 변경 시 문서와 코드가 동시에 커밋되어 AI가 다음 세션에서도 최신 맥락을 유지한다.

**이 프로젝트에서의 실제 효과**

`Surgical Changes` 원칙이 LLM 병렬화 작업에서 효과를 발휘했다. Spring Boot에서 병렬 처리를 구현할 때 AI가 인접한 OCR 처리 코드를 "개선"하려는 경향을 보였는데, 이 원칙이 명시되어 있어 변경이 요청된 범위(LLM 호출 레이어)에만 집중됐다. 또한 프롬프트 금고에 보관된 YOLO 학습 파이프라인 설계 프롬프트가 V2 → V3 전환 시 재사용되어, 이전 설계 의도를 그대로 이어받아 Hard Negative Mining 구성을 작성할 수 있었다.

---

### 요약

| 워크플로우 | 해결한 문제 | 효과 |
|-----------|-----------|------|
| Plan-First + 승인 게이트 | AI 코드 생성 시 작업 범위 이탈, 예상 외 변경 리스크 | 구현 전 영향 범위 사전 확정 |
| 역할 분리 (Researcher / Planner / Reviewer) | 단일 AI의 구현·검증 편향 | 구현과 검증 과정 독립 운영 |
| 프롬프트 및 훅 로그 관리 | AI 작업의 재현 불가·원인 추적 불가 | 오류 원인 추적 및 작업 재현성 확보 |
| AI 실무 인프라 (CLAUDE.md + Prompt Vault + 권한 제어) | 세션 간 컨텍스트 소실, 규칙 미준수, 권한 범위 이탈 | 일관된 AI 동작 + 프롬프트 재사용 자산화 |

---

**작성자**: S14P11A505 팀  
**최초 작성일**: 2026.02.11  
**기술 상세 보강**: 2026.05.28
