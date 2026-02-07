# 🚀 병렬 처리 최적화 리포트

## 📋 개요

| 항목 | 내용 |
|---|---|
| **작업일** | 2026-02-07 |
| **대상 파일** | `OcrAnalysisService.java` |
| **목표** | 제품 분석 API의 응답 시간 단축 |
| **결과** | **43초 → 16초** (63% 성능 향상) |

---

## 🔍 문제 분석

### 기존 구조의 문제점

기존 코드는 `synchronized` 키워드가 **메서드 전체**에 적용되어 있어, 병렬 처리를 구현했음에도 불구하고 실제로는 **순차 처리**가 발생하고 있었습니다.

```java
// ❌ 문제가 있던 코드
private synchronized ProductWithIngredients fetchAndSaveProductFromLlm(...) {
    // LLM 호출 (7~9초 소요)
    extractionResult = llmServiceFacade.queryWithRetry(...);
    
    // DB 저장
    productRepository.save(product);
    ingredientRepository.save(ingredient);
    ...
}
```

### 문제점 상세

1. **LLM 호출도 동기화됨**: LLM API 호출(7~9초)이 `synchronized` 블록 내부에 있어 한 번에 하나의 스레드만 실행
2. **병렬 효과 무효화**: 4개 스레드가 생성되었지만, 순차적으로 대기하며 실행
3. **실제 처리 시간**: 4개 제품 × 10초 = ~40초 (순차)

### 성능 병목 원인

```
Thread 1: [=====LLM 호출=====][DB 저장]
Thread 2:                              [=====LLM 호출=====][DB 저장]
Thread 3:                                                          [=====LLM 호출=====][DB 저장]
Thread 4:                                                                                      [=====LLM 호출=====][DB 저장]
          ────────────────────────────────────────────────────────────────────────────────────────────────────────────────>
          0초         10초        20초         30초         40초
```

---

## ✅ 해결 방안

### 핵심 아이디어

**LLM 호출은 병렬로, DB 저장은 동기화**

- LLM API는 외부 네트워크 호출로, 스레드 안전성 문제 없음 → **병렬 실행 가능**
- DB 저장은 데이터 무결성 보장 필요 → **동기화 필요**

### 코드 변경 사항

#### 변경 전 (문제 코드)

```java
private synchronized ProductWithIngredients fetchAndSaveProductFromLlm(
        String rawProductName,
        Map<String, IngredientIntakeInfo> currentIntakeMap) {
    
    // LLM 호출 (동기화 블록 내부 - 문제!)
    extractionResult = llmServiceFacade.queryWithRetry(...);
    
    // DB 저장 (동기화 블록 내부)
    Product savedProduct = productRepository.save(product);
    // ... 성분 저장 로직
}
```

#### 변경 후 (최적화 코드)

```java
private ProductWithIngredients fetchAndSaveProductFromLlm(
        String rawProductName,
        Map<String, IngredientIntakeInfo> currentIntakeMap) {
    
    // LLM 호출 (병렬 실행 가능)
    extractionResult = llmServiceFacade.queryWithRetry(...);
    
    // DB 저장 (동기화 블록으로 보호)
    synchronized (this) {
        Product savedProduct = productRepository.save(product);
        // ... 성분 저장 로직
    }
}
```

### 변경된 메서드

| 메서드 | 변경 내용 |
|-------|----------|
| `fetchAndSaveProductFromLlm()` | `synchronized` 메서드 → DB 저장만 `synchronized` 블록 |
| `fetchAndSaveIngredientsFromLlm()` | `synchronized` 메서드 → DB 저장만 `synchronized` 블록 |

---

## 📊 성능 측정 결과

### 테스트 환경

- **제품 수**: 4개
- **테스트 이미지**: 영양제 4종 촬영 이미지
- **LLM**: Gemini API (GMS)

### 시간 비교

| 단계 | 이전 (순차) | 이후 (병렬) | 개선율 |
|------|-----------|-----------|--------|
| FastAPI 호출 | 3.5초 | 3.5초 | - |
| 제품 처리 (4개) | **39초** | **12.3초** | **68% ↓** |
| **전체 처리** | **~43초** | **~16초** | **63% ↓** |

### 병렬 처리 동작 확인 (로그)

```
01:01:45.377 [pool-6-thread-1] >>> [GMS 호출] 제품 'OLDUM 칼슘앤마그네슘'
01:01:45.377 [pool-6-thread-2] >>> [GMS 호출] 제품 'DALE Multi Vitamin'
01:01:45.377 [pool-6-thread-3] >>> [GMS 호출] 제품 '뉴트리디데이 오메가-3'
01:01:45.382 [pool-6-thread-4] >>> [GMS 호출] 제품 'FA 눈건강 비타민A'
          ↓
    (4개 스레드 동시 LLM 호출!)
          ↓
01:01:53.031 [pool-6-thread-4] <<< [GMS 응답] (7.6초)
01:01:53.633 [pool-6-thread-2] <<< [GMS 응답] (8.2초)
01:01:53.830 [pool-6-thread-3] <<< [GMS 응답] (8.4초)
01:01:54.660 [pool-6-thread-1] <<< [GMS 응답] (9.3초)
```

### 처리 시간 시각화

#### 이전 (순차 처리)
```
Thread 1: [==========LLM==========][DB]
Thread 2:                              [==========LLM==========][DB]
Thread 3:                                                           [==========LLM==========][DB]
Thread 4:                                                                                        [==========LLM==========][DB]
          ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────>
          0초         10초        20초         30초         40초
```

#### 이후 (병렬 처리)
```
Thread 1: [==========LLM==========][DB]
Thread 2: [==========LLM==========]    [DB]
Thread 3: [==========LLM==========]        [DB]
Thread 4: [==========LLM==========]            [DB]
          ─────────────────────────────────────>
          0초         10초         16초
```

---

## 🛡️ 데이터 무결성 보장

### 동기화 전략

```java
synchronized (this) {
    // 1. Product 저장
    Product savedProduct = productRepository.save(product);
    
    // 2. Ingredient 조회/생성
    Ingredient ingredient = ingredientRepository.findByIngredientName(ingName)
            .orElseGet(() -> ingredientRepository.save(newIngredient));
    
    // 3. ProductIngredient 연결 (중복 체크)
    if (!productIngredientRepository.existsByProductAndIngredient(savedProduct, ingredient)) {
        productIngredientRepository.save(productIngredient);
    }
}
```

### 보호되는 작업

| 작업 | 동기화 필요 이유 |
|------|---------------|
| Product 저장 | ID 자동 생성, 중복 방지 |
| Ingredient 조회/생성 | 동일 성분 중복 생성 방지 |
| ProductIngredient 연결 | FK 관계 무결성 보장 |

---

## 📁 변경된 파일

### `OcrAnalysisService.java`

| 라인 범위 | 변경 내용 |
|----------|----------|
| 370-468 | `fetchAndSaveProductFromLlm()` 메서드 동기화 범위 축소 |
| 470-568 | `fetchAndSaveIngredientsFromLlm()` 메서드 동기화 범위 축소 |

---

## 🎯 결론

### 성과 요약

| 지표 | 수치 |
|-----|------|
| **응답 시간 단축** | 27초 (43초 → 16초) |
| **성능 개선율** | 63% |
| **데이터 무결성** | ✅ 보장 |
| **코드 변경량** | 최소 (동기화 범위만 조정) |

### 최적화 핵심 원칙

> **"I/O 바운드 작업은 병렬로, 공유 자원 접근은 동기화"**

- LLM API 호출 = I/O 바운드 → 병렬 실행
- DB 저장 = 공유 자원 접근 → 동기화 보호

### 추가 최적화 가능 영역

1. **섭취 시간 추천 LLM 호출도 병렬화**: 현재는 제품 추출 후 순차 호출
2. **DB 저장 배치 처리**: 여러 건을 모아서 한 번에 저장
3. **캐싱**: 자주 조회되는 성분 정보 캐싱
