# 백엔드 기술적 문제 분석 보고서

> **분석 일시**: 2026-02-06  
> **분석 대상**: `yaksok` Spring Boot 백엔드 프로젝트

---

## 📊 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프레임워크 | Spring Boot 3.5.10-SNAPSHOT |
| Java 버전 | 17 |
| 주요 모듈 | analyze, auth, notification, product, user, disease, ingredient, intake |
| 서비스 클래스 | 20개 |
| 컨트롤러 | 8개 |
| 테스트 클래스 | 9개 |

---

## 🚨 심각도 높음 (Critical)

### 1. God Class 문제 - `OcrAnalysisService.java`

- **파일**: `src/main/java/com/ssafy/yaksok/analyze/service/OcrAnalysisService.java`
- **줄 수**: 545줄

**문제점**:
- 단일 서비스 클래스가 너무 많은 책임을 가짐
- DB 조회, LLM 호출, 단위 변환, 과다섭취 판정 등 여러 도메인 로직 혼재
- 유지보수 및 테스트가 어려움

**권장 개선**:
- 책임별로 서비스 분리 (예: `ProductLookupService`, `IngredientProcessingService`, `OverdoseValidationService`)
- 파사드 패턴 활용

---

### 2. 예외 처리 불일치

**분석 결과**: `RuntimeException` 직접 사용 **10건** 발견

| 위치 | 문제 |
|------|------|
| `AnalyzeService.java:59` | `throw new RuntimeException("이미지 파일 처리 중 오류...")` |
| `AnalyzeService.java:62` | `throw new RuntimeException("AI 분석 서버와의 통신...")` |
| `OpenAILLMServiceImpl.java:87,119,134` | API 호출/파싱 실패 시 RuntimeException |
| `ProductMatchingService.java:79` | 제품 정보 없음 시 RuntimeException |

**문제점**:
- `GlobalExceptionHandler`가 `RuntimeException`을 제대로 처리하지 못함
- 클라이언트에게 의미 없는 500 에러만 전달됨
- 기존 `BusinessException` + `ErrorCode` 패턴이 있지만 일관되게 사용되지 않음

**권장 개선**:
```java
// Before
throw new RuntimeException("AI 분석 서버와의 통신에 실패했습니다.");

// After
throw new BusinessException(ErrorCode.AI_SERVER_CONNECTION_FAILED);
```

---

### 3. 에러 코드 중복

`ErrorCode.java` 분석 결과:

| 중복 코드 | 사용처 |
|-----------|--------|
| `AUTH_001` | `AUTH_LOGIN_FAIL`, `AUTH_OAUTH_LOGIN_FAIL` |
| `NOTIFICATION_404` | `NOTIFICATION_NOT_FOUND`, `NOTIFICATION_SETTING_NOT_FOUND`, `NOTIFICATION_LOG_NOT_FOUND` |
| `USER_PRODUCT_409` | 메시지가 `NOT_FOUND`와 불일치 |

**문제점**:
- 에러 추적/디버깅이 어려움
- 클라이언트에서 에러 구분 불가

---

### 4. 테스트 커버리지 부족

**현재 테스트 현황** (9개):
- ✅ `auth/controller/AuthControllerTest.java`
- ✅ `auth/service/AuthServiceTest.java`
- ✅ `disease/controller/DiseaseControllerTest.java`
- ✅ `user/controller/UserControllerTest.java`
- ✅ `user/controller/UserControllerIntegrationTest.java`
- ✅ `user/service/UserServiceTest.java`
- ✅ `notification` (FcmNotificationTest, NotificationFlowTest)
- ✅ `global/init/IngredientLoadingTest.java`

**테스트 부재 모듈**:
- ❌ `analyze` (핵심 비즈니스 로직)
- ❌ `product`
- ❌ `intake`
- ❌ `ingredient` (단위 변환 등)

---

## ⚠️ 심각도 중간 (Warning)

### 5. N+1 쿼리 문제 가능성

`Product.java`:
```java
@OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
private List<ProductIngredient> productIngredients = new ArrayList<>();
```

**문제점**:
- 기본 `FetchType.LAZY`로 설정됨
- `OcrAnalysisService.processAnalysisResult()`에서 반복문 내 `getProductIngredients()` 호출
- N개의 제품 분석 시 N+1 쿼리 발생 가능

**권장 개선**:
```java
// Repository에 Fetch Join 쿼리 추가
@Query("SELECT p FROM Product p LEFT JOIN FETCH p.productIngredients WHERE p.prdlstNm = :name")
Optional<Product> findByPrdlstNmWithIngredients(@Param("name") String prdlstNm);
```

---

### 6. JWT 토큰 만료 시간 설정

`JwtTokenProvider.java`:
```java
private static final long ACCESS_TOKEN_EXPIRE_TIME = 1000L * 60 * 60; // 60분
private static final long REFRESH_TOKEN_EXPIRE_TIME = 1000L * 60 * 60 * 24; // 24시간
```

**검토 필요**:
- Access Token 60분: 모바일 앱 특성상 너무 짧을 수 있음
- Refresh Token 24시간: 일반적으로 7-30일 권장

---

### 7. CORS 설정 하드코딩

`SecurityConfig.java`:
```java
config.setAllowedOrigins(List.of(
    "http://localhost:3000",
    "https://i14a505.p.ssafy.io"));
```

**문제점**:
- 환경별 설정 변경 시 코드 수정 필요
- 배포 파이프라인에서 유연성 부족

**권장 개선**: `application.yml`에서 환경 변수로 관리

---

### 8. @Transactional 어노테이션 불일치

`FcmTokenService.java` 분석:

```java
// 일부 메서드만 @Transactional 사용 (풀패키지 사용)
@org.springframework.transaction.annotation.Transactional
public void createOrUpdateFcmToken(...) { ... }

// updateToken(), updateTokenActive()는 @Transactional 없음
public void updateToken(long userId, String token) {
    UserFcmToken userFcmToken = findByUserId(userId);
    userFcmToken.updateToken(token);  // 변경이 저장되지 않을 수 있음!
}
```

---

## 📋 심각도 낮음 (Info)

### 9. 오타 및 네이밍 이슈

| 위치 | 문제 |
|------|------|
| `security/contants/` | "constants" 오타 |
| `Product.prdlstNm` | 한국어 약어 사용으로 가독성 저하 |

---

### 10. 테스트 엔드포인트 남아있음

`AnalyzeController.java:52-55`:
```java
@GetMapping("/test")
public ResponseEntity<ApiResponse<Void>> analyzeTest(){
    return ResponseUtil.ok();
}
```

**권장**: 프로덕션 배포 전 제거 또는 `@Profile("dev")` 추가

---

### 11. 주석 처리된 코드 다수

여러 파일에서 주석 처리된 레거시 코드 발견:
- `MatchingContext.java`
- `ProductDataLoader.java`
- `IngredientDataLoader.java`
- `IngredientUnitConversionService.java`

**권장**: 버전 관리 시스템으로 대체하고 주석 코드 제거

---

### 12. Spring Boot SNAPSHOT 버전 사용

`build.gradle`:
```gradle
id 'org.springframework.boot' version '3.5.10-SNAPSHOT'
```

**권장**: 프로덕션 환경에서는 안정 버전 사용 권장

---

## 📈 개선 우선순위

| 우선순위 | 항목 | 영향도 | 난이도 |
|:---:|------|:---:|:---:|
| 1 | RuntimeException → BusinessException 전환 | 높음 | 낮음 |
| 2 | ErrorCode 중복 수정 | 높음 | 낮음 |
| 3 | @Transactional 누락 수정 | 높음 | 낮음 |
| 4 | analyze, product 모듈 테스트 추가 | 높음 | 중간 |
| 5 | OcrAnalysisService 리팩토링 | 중간 | 높음 |
| 6 | N+1 쿼리 최적화 | 중간 | 중간 |
| 7 | CORS 환경 변수화 | 낮음 | 낮음 |
| 8 | JWT 만료 시간 검토 | 낮음 | 낮음 |

---

## 🔍 추가 분석 필요 항목

1. **성능 프로파일링**: 실제 N+1 쿼리 발생 여부 확인
2. **보안 감사**: JWT secret 키 강도, SQL Injection 취약점 등
3. **로깅 전략**: 현재 로깅 레벨 DEBUG로 설정되어 있어 프로덕션에서 성능 영향 가능
