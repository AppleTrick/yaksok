# 성분 데이터 정규화 및 상한 초과 경고 기능

## 📅 작업일: 2026-02-07

## 📋 작업 개요

영양제 성분 저장 시 발생하던 문제점을 해결하고, 상한 섭취량 초과 시 사용자에게 경고하는 기능을 구현했습니다.

### 해결한 문제점
1. **min/max 섭취량 하드코딩**: `0.00, 9999.00`으로 하드코딩되어 있던 값을 식약처 기준 데이터로 대체
2. **성분명 중복 저장**: "티아민", "비타민B1", "B1" 등이 각각 별도로 저장되던 문제 → 정규화로 "비타민 B1"로 통일
3. **상한 초과 미경고**: 사용자가 상한 섭취량을 초과해도 알림이 없던 문제 → 경고 모달 추가

---

## 🔧 생성/수정된 파일

### 백엔드

| 파일 | 변경 내용 |
|------|----------|
| `ingredient/util/IngredientNameNormalizer.java` | 성분명 별칭 매핑 테이블 (50개+ 성분 지원) |
| `ingredient/util/NutrientReferenceData.java` | 2020 한국인 영양소 섭취기준(KDRIs) 기반 권장/상한 섭취량 데이터 |
| `global/common/llm/prompt/ProductExtractionPrompt.java` | LLM 프롬프트에 표준 성분명 규칙 추가 |
| `global/common/dto/ProductExtractionResponse.java` | DTO에 `recommendedIntake`, `upperLimit` 필드 추가 |
| `analyze/service/OcrAnalysisService.java` | 성분명 정규화 및 식약처 기준 섭취량 적용 |

### 프론트엔드

| 파일 | 변경 내용 |
|------|----------|
| `app/report/page.tsx` | 상한 초과 경고 모달 추가 |

---

## 🎯 주요 기능

### 1. 성분명 정규화 (IngredientNameNormalizer)

다양한 형태의 성분명을 표준 형식으로 변환합니다.

```
입력: "티아민", "B1", "비타민B1", "비타민b1(티아민)"
출력: "비타민 B1"
```

**지원 성분 카테고리:**
- 비타민 B군 (B1~B12)
- 기타 비타민 (A, C, D, E, K)
- 미네랄 (칼슘, 마그네슘, 아연, 철분, 셀레늄 등)
- 오메가 지방산 (EPA, DHA, 오메가-3)
- 아미노산 (BCAA, 로이신, 글루타민 등)
- 허브/식물 추출물 (밀크씨슬, 인삼, 녹차추출물 등)
- 피부/모발 건강 (콜라겐, 히알루론산, 케라틴 등)
- 수면/스트레스 (멜라토닌, GABA, 테아닌 등)

### 2. 식약처 기준 섭취량 (NutrientReferenceData)

2020 한국인 영양소 섭취기준(KDRIs) 기반 데이터입니다.

| 성분 | 권장섭취량 | 상한섭취량 | 단위 |
|------|-----------|-----------|------|
| 비타민 B1 | 1.2 | - | mg |
| 비타민 C | 100 | 2000 | mg |
| 비타민 D | 10 | 100 | μg |
| 비타민 A | 700 | 3000 | μg |
| 칼슘 | 700 | 2500 | mg |
| 아연 | 8.5 | 35 | mg |
| 루테인 | 10 | 20 | mg |

### 3. 상한 초과 경고 모달

리포트 페이지에서 **"영양제 등록하기" 버튼 클릭 시** 상한 섭취량 초과 성분이 있으면 경고 모달을 표시합니다.

**동작 흐름:**
1. 사용자가 리포트 페이지에서 영양제 확인
2. "영양제 등록하기" 버튼 클릭
3. `status === 'warning'`인 성분 체크
4. 초과 성분이 있으면 경고 모달 표시
5. "확인" 클릭 시 `/camera`로 리다이렉트

---

## 💾 기존 데이터 마이그레이션 SQL

기존에 잘못된 값으로 저장된 성분을 업데이트하는 SQL입니다.

```sql
-- 비타민
UPDATE ingredient SET min_intake_value = 700.0, max_intake_value = 3000.0 WHERE ingredient_name = '비타민 A';
UPDATE ingredient SET min_intake_value = 100.0, max_intake_value = 2000.0 WHERE ingredient_name = '비타민 C';
UPDATE ingredient SET min_intake_value = 10.0, max_intake_value = 100.0 WHERE ingredient_name = '비타민 D';
UPDATE ingredient SET min_intake_value = 12.0, max_intake_value = 540.0 WHERE ingredient_name = '비타민 E';

-- 미네랄
UPDATE ingredient SET min_intake_value = 700.0, max_intake_value = 2500.0 WHERE ingredient_name = '칼슘';
UPDATE ingredient SET min_intake_value = 8.5, max_intake_value = 35.0 WHERE ingredient_name = '아연';
UPDATE ingredient SET min_intake_value = 60.0, max_intake_value = 400.0 WHERE ingredient_name = '셀레늄';

-- 눈 건강
UPDATE ingredient SET min_intake_value = 10.0, max_intake_value = 20.0 WHERE ingredient_name = '루테인';
UPDATE ingredient SET min_intake_value = 2.0, max_intake_value = 4.0 WHERE ingredient_name = '지아잔틴';

-- 하드코딩값 일괄 수정 (NULL로 변경하여 프론트에서 safe 처리)
UPDATE ingredient SET max_intake_value = NULL WHERE max_intake_value = 9999.00;
```

---

## ✅ 검증 결과

- [x] 백엔드 Gradle 빌드 성공
- [x] 프론트엔드 개발 서버 정상 동작

---

## 📝 테스트 방법

1. 앱에서 영양제 스캔
2. 리포트 페이지에서 성분 확인
3. "영양제 등록하기" 클릭
4. 상한 초과 성분이 있으면 경고 모달 확인
5. "확인" 클릭 시 카메라 페이지로 이동 확인

```sql
-- 새로 저장된 성분 확인
SELECT id, ingredient_name, min_intake_value, max_intake_value, display_unit 
FROM ingredient 
ORDER BY id DESC 
LIMIT 20;
```
