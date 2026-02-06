# 🔧 DB 쿼리 튜닝 및 최적화 분석 리포트

## 📋 개요

| 항목 | 내용 |
|---|---|
| **분석일** | 2026-02-07 |
| **분석 대상** | `OcrAnalysisService` DB 쿼리 |
| **목표** | 쿼리 성능 최적화 가능 영역 도출 |

---

## 🔍 현재 쿼리 패턴 분석

### 로그에서 확인된 주요 쿼리

분석 API 호출 시 다음과 같은 쿼리가 실행됩니다:

| # | 쿼리 유형 | 실행 횟수 (4개 제품 기준) | 내용 |
|---|----------|------------------------|------|
| 1 | Product 조회 (정확 일치) | 4회 | `WHERE prdlst_nm = ?` |
| 2 | Product 조회 (LIKE) | 4회 | `WHERE prdlst_nm LIKE ?` |
| 3 | Ingredient 조회 | 30+회 | `WHERE ingredient_name = ?` |
| 4 | ProductIngredient 존재 확인 | 30+회 | `WHERE product_id = ? AND ingredient_id = ?` |
| 5 | INSERT (product) | 4회 | 제품 저장 |
| 6 | INSERT (ingredient) | 15+회 | 성분 저장 |
| 7 | INSERT (product_ingredient) | 30+회 | 연결 테이블 저장 |

### 로그 예시 (중복 쿼리 발생)

```sql
-- 같은 패턴의 쿼리가 반복 실행됨
Hibernate: select i1_0.id, ... from ingredient i1_0 where i1_0.ingredient_name=?
Hibernate: select i1_0.id, ... from ingredient i1_0 where i1_0.ingredient_name=?
Hibernate: select i1_0.id, ... from ingredient i1_0 where i1_0.ingredient_name=?
...
```

---

## ⚠️ 발견된 최적화 가능 영역

### 1. 인덱스 미설정 🔴 (높은 우선순위)

#### 문제점

현재 Entity에 **인덱스가 설정되어 있지 않습니다:**

```java
// Product.java - 인덱스 없음
@Column(name = "PRDLST_NM")  // ❌ 인덱스 없음
private String prdlstNm;

// Ingredient.java - unique만 있고 명시적 인덱스 없음
@Column(name = "ingredient_name", unique = true)  // unique 제약은 있지만...
private String ingredientName;
```

#### 현재 발생하는 쿼리

```sql
-- Full Table Scan 가능성
SELECT * FROM product WHERE prdlst_nm = 'OLDUM 칼슘앤마그네슘';
SELECT * FROM product WHERE prdlst_nm LIKE '%칼슘%';
SELECT * FROM ingredient WHERE ingredient_name = '비타민C';
```

#### 개선안

```java
// Product.java
@Entity
@Table(name = "product", indexes = {
    @Index(name = "idx_product_name", columnList = "prdlst_nm")
})
public class Product {
    // ...
}

// Ingredient.java
@Entity
@Table(name = "ingredient", indexes = {
    @Index(name = "idx_ingredient_name", columnList = "ingredient_name")
})
public class Ingredient {
    // ...
}

// ProductIngredient.java
@Entity
@Table(name = "product_ingredient", indexes = {
    @Index(name = "idx_pi_product_ingredient", columnList = "product_id, ingredient_id")
})
public class ProductIngredient {
    // ...
}
```

#### 예상 효과

| 쿼리 | 개선 전 | 개선 후 |
|-----|--------|--------|
| `findByPrdlstNm` | Full Scan (O(n)) | Index Seek (O(log n)) |
| `findByIngredientName` | Full Scan | Index Seek |
| `existsByProductAndIngredient` | Full Scan | Composite Index Seek |

---

### 2. 성분 조회 반복 (N+1 유사 문제) 🟠 (중간 우선순위)

#### 문제점

동일한 성분(예: 비타민C, 아연)에 대해 **반복 조회**가 발생합니다:

```java
for (var ingInfo : extractionResult.getIngredients()) {
    // 매번 DB 조회 발생
    Ingredient ingredient = ingredientRepository.findByIngredientName(ingName)
            .orElseGet(() -> ingredientRepository.save(newIngredient));
}
```

**로그 예시:**
```
Thread-1: SELECT ... WHERE ingredient_name='비타민C'
Thread-2: SELECT ... WHERE ingredient_name='비타민C'  // 중복!
Thread-3: SELECT ... WHERE ingredient_name='비타민C'  // 중복!
```

#### 개선안 1: 1차 캐시 활용 (메모리 캐싱)

```java
// 서비스 레벨에서 캐시 맵 사용
private final Map<String, Ingredient> ingredientCache = new ConcurrentHashMap<>();

private Ingredient getOrCreateIngredient(String ingredientName, String unit) {
    return ingredientCache.computeIfAbsent(ingredientName, name -> 
        ingredientRepository.findByIngredientName(name)
            .orElseGet(() -> ingredientRepository.save(Ingredient.builder()
                .ingredientName(name)
                .displayUnit(unit)
                .build()))
    );
}
```

#### 개선안 2: Batch 조회 후 처리

```java
// 1. 필요한 성분명 목록 추출
Set<String> ingredientNames = extractionResult.getIngredients().stream()
    .map(IngredientInfo::getName)
    .collect(Collectors.toSet());

// 2. 한 번의 쿼리로 모든 성분 조회
List<Ingredient> existingIngredients = ingredientRepository.findByIngredientNameIn(ingredientNames);
Map<String, Ingredient> ingredientMap = existingIngredients.stream()
    .collect(Collectors.toMap(Ingredient::getIngredientName, i -> i));

// 3. 없는 성분만 생성
for (var ingInfo : extractionResult.getIngredients()) {
    Ingredient ingredient = ingredientMap.getOrDefault(ingName, createNewIngredient(ingInfo));
}
```

---

### 3. INSERT 배치 처리 미적용 🟠 (중간 우선순위)

#### 문제점

현재 개별 INSERT가 반복 실행됩니다:

```java
// 각 성분마다 개별 save() 호출
for (var ingInfo : extractionResult.getIngredients()) {
    ingredientRepository.save(ingredient);           // INSERT 1개
    productIngredientRepository.save(productIngredient);  // INSERT 1개
}
```

**로그 예시:**
```sql
Hibernate: insert into ingredient ...
Hibernate: insert into product_ingredient ...
Hibernate: insert into ingredient ...
Hibernate: insert into product_ingredient ...
-- 반복...
```

#### 개선안: Batch Insert 적용

**방법 1: `saveAll()` 사용**

```java
// 개별 저장 대신 배치 저장
List<Ingredient> newIngredients = new ArrayList<>();
List<ProductIngredient> productIngredients = new ArrayList<>();

for (var ingInfo : extractionResult.getIngredients()) {
    // 엔티티 생성만 하고 리스트에 추가
    newIngredients.add(newIngredient);
    productIngredients.add(newProductIngredient);
}

// 한 번에 저장
ingredientRepository.saveAll(newIngredients);
productIngredientRepository.saveAll(productIngredients);
```

**방법 2: application.yml 설정**

```yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
```

---

### 4. existsByProductAndIngredient 개선 🟡 (낮은 우선순위)

#### 문제점

중복 확인을 위해 매번 `exists` 쿼리 실행:

```java
if (!productIngredientRepository.existsByProductAndIngredient(savedProduct, ingredient)) {
    productIngredientRepository.save(...);
}
```

#### 개선안: INSERT IGNORE 또는 ON DUPLICATE KEY

```java
// Repository에 네이티브 쿼리 추가
@Modifying
@Query(value = """
    INSERT IGNORE INTO product_ingredient (product_id, ingredient_id, ingredient_amount, amount_unit)
    VALUES (:productId, :ingredientId, :amount, :unit)
    """, nativeQuery = true)
void insertIgnoreDuplicate(
    @Param("productId") Long productId,
    @Param("ingredientId") Long ingredientId,
    @Param("amount") BigDecimal amount,
    @Param("unit") String unit
);
```

---

### 5. Containing 검색 최적화 🟡 (낮은 우선순위)

#### 문제점

```java
// LIKE '%..%' 쿼리는 인덱스 활용 불가
productRepository.findByPrdlstNmContaining(rawName);
```

```sql
WHERE prdlst_nm LIKE '%칼슘%'  -- Full Table Scan
```

#### 개선안: Full-Text Index 적용 (선택사항)

```sql
-- MySQL Full-Text Index
ALTER TABLE product ADD FULLTEXT INDEX ft_product_name (prdlst_nm);

-- 검색 쿼리
SELECT * FROM product WHERE MATCH(prdlst_nm) AGAINST('칼슘' IN NATURAL LANGUAGE MODE);
```

---

## 📊 최적화 우선순위 요약

| 순위 | 최적화 항목 | 난이도 | 예상 효과 | 구현 복잡도 |
|-----|-----------|-------|----------|-----------|
| 🔴 **1** | 인덱스 추가 | 낮음 | **높음** | ⭐ |
| 🟠 **2** | 성분 조회 캐싱 | 중간 | 중간 | ⭐⭐ |
| 🟠 **3** | Batch Insert | 중간 | 중간 | ⭐⭐ |
| 🟡 **4** | INSERT IGNORE | 중간 | 낮음 | ⭐⭐ |
| 🟡 **5** | Full-Text Index | 높음 | 낮음 | ⭐⭐⭐ |

---

## 🚀 권장 구현 순서

### Phase 1: 인덱스 추가 (즉시 적용 권장)

```java
// Product.java
@Table(name = "product", indexes = {
    @Index(name = "idx_product_prdlst_nm", columnList = "prdlst_nm")
})

// Ingredient.java  
@Table(name = "ingredient", indexes = {
    @Index(name = "idx_ingredient_name", columnList = "ingredient_name")
})

// ProductIngredient.java
@Table(name = "product_ingredient", indexes = {
    @Index(name = "idx_pi_product_id", columnList = "product_id"),
    @Index(name = "idx_pi_ingredient_id", columnList = "ingredient_id"),
    @Index(name = "idx_pi_product_ingredient", columnList = "product_id, ingredient_id")
})
```

### Phase 2: Hibernate Batch 설정

```yaml
# application.yml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true
        generate_statistics: true  # 성능 모니터링용
```

### Phase 3: 코드 레벨 최적화 (선택사항)

- 성분 캐시 구현
- Batch 조회/저장 로직 리팩토링

---

## 📈 예상 성능 개선 효과

| 항목 | 현재 | 개선 후 (예상) |
|-----|-----|--------------|
| 제품 조회 | ~50ms | ~5ms |
| 성분 조회 (30회) | ~300ms | ~30ms (캐시) |
| ProductIngredient 저장 | ~500ms | ~100ms (배치) |
| **DB 작업 총합** | ~1초 | ~200ms |

---

## 🔎 추가 모니터링 권장

### Hibernate Statistics 활성화

```yaml
spring:
  jpa:
    properties:
      hibernate:
        generate_statistics: true
```

### 슬로우 쿼리 로깅

```yaml
logging:
  level:
    org.hibernate.SQL: DEBUG
    org.hibernate.stat: DEBUG
    org.hibernate.engine.jdbc.batch: TRACE
```

---

## 📌 결론

| 최적화 | 적용 난이도 | 비용 대비 효과 |
|-------|-----------|--------------|
| **인덱스 추가** | ⭐ (매우 쉬움) | 🔥🔥🔥 (매우 높음) |
| **Batch 설정** | ⭐ (설정만) | 🔥🔥 (높음) |
| **캐싱 구현** | ⭐⭐ (코드 수정) | 🔥 (중간) |

> **권장사항**: 인덱스 추가 + Hibernate Batch 설정을 먼저 적용하면, 최소한의 코드 변경으로 DB 작업 성능을 **5~10배** 개선할 수 있습니다.
