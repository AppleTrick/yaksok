# 성능 분석 보고서: 순차 처리 (Before)

> **측정 일시**: 2026-02-07 00:34:43 ~ 00:35:22  
> **분석 대상**: 영양제 이미지 분석 API (`/api/v1/analyze`)  
> **테스트 조건**: 4개 제품이 포함된 이미지 1장

---

## 📊 전체 성능 요약

| 항목 | 소요 시간 |
|------|--------:|
| **전체 API 응답 시간** | **39,881ms** |
| FastAPI 호출 (AI 서버) | 3,704ms |
| 비즈니스 로직 처리 | 36,177ms |
| └ 제품 처리 (4개) | 36,143ms |

```
┌────────────────────────────────────────────────────────────────────────┐
│                        전체 처리 시간: 39.9초                            │
├─────────┬──────────────────────────────────────────────────────────────┤
│ FastAPI │                    비즈니스 로직 (36.2초)                      │
│  3.7초  │  제품1   │   제품2    │   제품3   │   제품4   │               │
│         │  7.7초   │   12.6초   │   8.1초   │   7.6초   │               │
└─────────┴──────────┴────────────┴───────────┴───────────┘
```

---

## 📦 제품별 상세 분석

### 제품 1: 올덤 칼슘앤마그네슘
| 단계 | 소요 시간 | 비고 |
|------|--------:|------|
| 제품명 검증 | 2ms | 키워드 매칭 (LLM 스킵) |
| DB 검색 | 129ms | 제품 미발견 |
| 제품/성분 추출 (LLM) | **6,404ms** | 5개 성분 저장 |
| 섭취시간 추천 (LLM) | 1,203ms | BEFORESLEEP |
| **총 처리 시간** | **7,743ms** | |

---

### 제품 2: DALE Multi Vitamin & Mineral Premium
| 단계 | 소요 시간 | 비고 |
|------|--------:|------|
| 제품명 검증 | 1ms | 키워드 매칭 (LLM 스킵) |
| DB 검색 | 107ms | 제품 미발견 |
| 제품/성분 추출 (LLM) | **11,399ms** | 12개 성분 저장 ⚠️ |
| 섭취시간 추천 (LLM) | 1,128ms | AFTERMEAL |
| **총 처리 시간** | **12,636ms** | 가장 오래 걸림 |

> ⚠️ 성분 수가 많아 LLM 응답 시간 증가 (12개 성분)

---

### 제품 3: Nutri D-DAY 오메가-3 골드 1100
| 단계 | 소요 시간 | 비고 |
|------|--------:|------|
| 제품명 검증 | 0ms | 키워드 매칭 (LLM 스킵) |
| DB 검색 | 116ms | 제품 미발견 |
| 제품/성분 추출 (LLM) | **6,912ms** | 6개 성분 저장 |
| 섭취시간 추천 (LLM) | 1,118ms | AFTERMEAL |
| **총 처리 시간** | **8,146ms** | |

---

### 제품 4: FA 눈건강 비타민A
| 단계 | 소요 시간 | 비고 |
|------|--------:|------|
| 제품명 검증 | 0ms | 키워드 매칭 (LLM 스킵) |
| DB 검색 | 112ms | 제품 미발견 |
| 제품/성분 추출 (LLM) | **6,537ms** | 7개 성분 저장 |
| 섭취시간 추천 (LLM) | 898ms | AFTERMEAL |
| **총 처리 시간** | **7,550ms** | |

---

## 🔍 병목 지점 분석

### 시간 분포 (전체 39.9초 기준)

```
┌──────────────────────────────────────────────────────────────────────┐
│ FastAPI 호출        ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  9.3%   │
│ DB 검색 (4회)       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  1.2%   │
│ LLM 제품추출 (4회)  ░░░░░░░░████████████████████████████████ 78.4%   │
│ LLM 섭취시간 (4회)  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░████░░░░░░ 10.6%   │
│ 기타                ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0.5%   │
└──────────────────────────────────────────────────────────────────────┘
```

| 카테고리 | 총 소요 시간 | 비율 |
|----------|----------:|-----:|
| LLM 제품/성분 추출 | 31,252ms | **78.4%** |
| LLM 섭취시간 추천 | 4,347ms | 10.9% |
| FastAPI 호출 | 3,704ms | 9.3% |
| DB 검색 | 464ms | 1.2% |
| 기타 (단위변환 등) | ~100ms | 0.3% |

### 핵심 병목
1. **LLM 호출이 전체의 ~89%** 차지
2. **순차 처리**로 인해 4개 제품을 하나씩 처리
3. DB에 제품이 없어 매번 LLM 호출 필요

---

## 📈 병렬 처리 시 예상 개선

### 현재 (순차 처리)
```
FastAPI ──┬── 제품1 ── 제품2 ── 제품3 ── 제품4 ──┐
          │                                      │
          └──────────── 39.9초 ──────────────────┘
```

### 개선 후 (병렬 처리)
```
FastAPI ──┬── 제품1 (7.7초) ──────┐
          ├── 제품2 (12.6초) ─────┼── max: 12.6초 ──┐
          ├── 제품3 (8.1초) ──────┤                 │
          └── 제품4 (7.6초) ──────┘                 │
                                                   │
          └──────────── 예상: ~16.3초 ─────────────┘
```

| 처리 방식 | 예상 시간 | 개선율 |
|----------|--------:|------:|
| 현재 (순차) | 39.9초 | - |
| 개선 (병렬) | ~16.3초 | **59% 감소** |

---

## 🎯 결론

1. **가장 큰 병목**: LLM 호출 (약 89% 차지)
2. **순차 처리 비효율**: 7~12초씩 4번 = 약 36초 순차 대기
3. **병렬 처리 적용 시**: 제품 처리가 동시에 진행되어 **약 20초 이상 단축 가능**

---

## 📝 원본 로그 (요약)

```
00:34:43.028 - 이미지 분석 시작: User 1
00:34:46.732 - [성능측정] FastAPI 호출 완료: 3704ms
00:34:46.803 - [성능측정] 유저 섭취량 조회: 68ms

00:34:46.803 - >>> [제품 1/4] 올덤 칼슘앤마그네슘
00:34:53.340 - [성능측정] 제품1 - 제품/성분 추출 (LLM): 6404ms
00:34:54.543 - [성능측정] 제품1 - 섭취시간 추천 (LLM): 1203ms
00:34:54.546 - [성능측정] 제품1 - 총 처리 시간: 7743ms

00:34:54.546 - >>> [제품 2/4] DALE Multi Vitamin
00:35:06.054 - [성능측정] 제품2 - 제품/성분 추출 (LLM): 11399ms
00:35:07.182 - [성능측정] 제품2 - 섭취시간 추천 (LLM): 1128ms
00:35:07.182 - [성능측정] 제품2 - 총 처리 시간: 12636ms

00:35:07.182 - >>> [제품 3/4] Nutri D-DAY 오메가-3
00:35:14.210 - [성능측정] 제품3 - 제품/성분 추출 (LLM): 6912ms
00:35:15.328 - [성능측정] 제품3 - 섭취시간 추천 (LLM): 1118ms
00:35:15.328 - [성능측정] 제품3 - 총 처리 시간: 8146ms

00:35:15.328 - >>> [제품 4/4] FA 눈건강 비타민A
00:35:21.977 - [성능측정] 제품4 - 제품/성분 추출 (LLM): 6537ms
00:35:22.875 - [성능측정] 제품4 - 섭취시간 추천 (LLM): 898ms
00:35:22.878 - [성능측정] 제품4 - 총 처리 시간: 7550ms

00:35:22.878 - [성능측정] 전체 제품 처리 완료: 36143ms, 4개 제품
00:35:22.909 - [성능측정] 전체 분석 완료: 39881ms
```


```
2026-02-07T00:34:00.053+09:00  INFO 1728 --- [yaksok] [   noti-async-2] c.s.y.n.service.NotificationService      : 📊 알람 현황: 전체 미복용 알림=0건, 현재 발송 대상=0건
2026-02-07T00:34:00.053+09:00  INFO 1728 --- [yaksok] [   noti-async-2] c.s.y.n.service.NotificationService      : 알람 전송 프로세스 종료
2026-02-07T00:34:42.587+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] o.a.c.c.C.[Tomcat].[localhost].[/]       : Initializing Spring DispatcherServlet 'dispatcherServlet'
2026-02-07T00:34:42.588+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Initializing Servlet 'dispatcherServlet'
2026-02-07T00:34:42.590+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] o.s.web.servlet.DispatcherServlet        : Completed initialization in 2 ms
2026-02-07T00:34:42.639+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] o.s.security.web.FilterChainProxy        : Securing POST /api/v1/analyze
2026-02-07T00:34:42.703+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.security.token.JwtTokenResolver    : 쿠키 개수: 1
Hibernate: 
    select
        u1_0.id,
        u1_0.age_group,
        u1_0.created_at,
        u1_0.email,
        u1_0.gender,
        u1_0.last_login_at,
        u1_0.name,
        u1_0.oauth_id,
        u1_0.oauth_provider,
        u1_0.password,
        u1_0.role,
        u1_0.status 
    from
        user u1_0 
    where
        u1_0.id=?
2026-02-07T00:34:42.919+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.s.filter.JwtAuthenticationFilter   : JWT 필터: 인증 성공 - path: /api/v1/analyze, userId: 1
2026-02-07T00:34:42.928+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] o.s.security.web.FilterChainProxy        : Secured POST /api/v1/analyze
2026-02-07T00:34:43.027+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.controller.AnalyzeController     : 영양제 분석 API 호출 시작: User ID=1, File=captured.jpg
2026-02-07T00:34:43.028+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.analyze.service.AnalyzeService     : 이미지 분석 시작: User 1
2026-02-07T00:34:46.719+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.analyze.service.AnalyzeService     : FastAPI 분석 결과 수신: FastApiAnalysisResult(success=true, message=Vision API & LLM Analysis Successful, step=VISION_API_WITH_LLM, analysisResults=[FastApiAnalysisResult.RawAnalysisResult(box=[0.01373291015625, 0.4609375, 0.255859375, 0.7890625], confidence=0.6538035869598389, productName=올덤 칼슘앤마그네슘, ocrText=ccm
OLDUM & MAGNESIUM
MNDZINC
칼슘앤마그네슘
비타민D 아연
건강기능식품
1000mg X 180정(180g), barcode=null), FastApiAnalysisResult.RawAnalysisResult(box=[0.46484375, 0.400390625, 0.74609375, 0.8125], confidence=0.6410408020019531, productName=DALE Multi Vitamin & Mineral Premium, ocrText=서울약사신협
DALE Multi Vitamin & Mineral Premium
멀티비타민 앤 미네랄
Premium
kinds of Vitamins, 2 kinds of Minerals
건강기능식품
GMP 1억 1,500mgx18020, barcode=null), FastApiAnalysisResult.RawAnalysisResult(box=[0.73046875, 0.4609375, 0.9921875, 0.8203125], confidence=0.6281826496124268, productName=Nutri D-DAY 오메가-3 골드 1100, ocrText=Nutri D-DAY!
ENTERIC COATED CAPSULE
PREMIUM
OMEGA-3
GOLD 1100
프리미엄 오래가-3 골드 1100
개선에 도움을 줄 수 있음
감소 도움을
EPA 및 DHA 함유유지+비타민D, barcode=null), FastApiAnalysisResult.RawAnalysisResult(box=[0.2353515625, 0.4609375, 0.474609375, 0.8125], confidence=0.6109005808830261, productName=FA 눈건강 비타민A, ocrText=FA
GMP
294
공급
눈건강 비타민A
TAMIN A WEA
장기능식품
ling(150정(135g), barcode=null)])
2026-02-07T00:34:46.732+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.analyze.service.AnalyzeService     : [성능측정] FastAPI 호출 완료: 3704ms
2026-02-07T00:34:46.735+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [분석 시작] User ID: 1, 감지된 제품 수: 4
Hibernate: 
    select
        i1_0.id,
        i1_0.ingredient_name,
        cast(sum(((pi1_0.ingredient_amount*up1_0.daily_dose)*coalesce(up1_0.dose_amount, 1.0))) as decimal(53, 20)),
        pi1_0.amount_unit,
        cast(i1_0.max_intake_value as decimal(53, 20)),
        cast(i1_0.min_intake_value as decimal(53, 20)) 
    from
        user_product up1_0 
    join
        product_ingredient pi1_0 
            on up1_0.product_id=pi1_0.product_id 
    join
        ingredient i1_0 
            on pi1_0.ingredient_id=i1_0.id 
    where
        up1_0.user_id=? 
        and up1_0.active=1 
    group by
        i1_0.id,
        i1_0.ingredient_name,
        pi1_0.amount_unit,
        i1_0.max_intake_value,
        i1_0.min_intake_value
2026-02-07T00:34:46.803+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 유저 섭취량 조회: 68ms, 0 종류
2026-02-07T00:34:46.803+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [제품 1/4] 처리 시작: 올덤 칼슘앤마그네슘
2026-02-07T00:34:46.804+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [0단계] 제품명 유효성 검증: '올덤 칼슘앤마그네슘'
2026-02-07T00:34:46.805+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [검증 결과] 주요 키워드 포함 확인 -> 무조건 통과
2026-02-07T00:34:46.806+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품1 - 제품명 검증 (LLM): 2ms
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm=?
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm like ? escape '\\'
2026-02-07T00:34:46.935+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품1 - DB 검색: 129ms
2026-02-07T00:34:46.936+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [3단계] DB에 제품 없음 -> GMS 호출하여 제품 및 성분 저장
2026-02-07T00:34:46.936+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 호출] 제품 '올덤 칼슘앤마그네슘' 정보 추출 요청
2026-02-07T00:34:46.936+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=ProductExtraction, type=ProductExtractionResponse, temp=1.0
2026-02-07T00:34:46.936+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 983 chars
2026-02-07T00:34:53.098+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (792 bytes): {
  "productName": "올덤 칼슘앤마그네슘",
  "primaryFunction": "뼈와 치아 건강 유지, 신경·근육 기능 유지에 도움(칼슘·마그네슘 보충)",
  "intakeMethod": "1일 2회, 1회 1정(또는 1캡슐)씩 물과 함께 섭취",
  "precautions": "임산부·수유부, 질환이 있거나 약물(특히 갑상선호르몬제, 테트라사이클린/퀴놀론계 항생제, 골다공증 치료제 등) 복용 중인 경우 전문가와 상담하세요. 칼슘·마그네슘은 일부 약물과 흡수 간섭이 있을 수 있어 2시간 이상 간격을 두는 것이 좋습니다. 고칼슘혈증/신장질환(신결석 포함) 병력이 있으면 섭취 전 상담하세요. 과다 섭취 시 위장불편, 변비(칼슘), 설사(마그네슘) 등이 나타날 수 있습니다.",
  "ingredients": [
    {
      "name": "칼슘",
      "amount": "500",
      "unit": "mg"
    },
    {
      "n...
2026-02-07T00:34:53.098+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=ProductExtractionResponse
2026-02-07T00:34:53.099+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "productName": "올덤 칼슘앤마그네슘",
  "primaryFunction": "뼈와 치아 건강 유지, 신경·근육 기능 유지에 도움(칼슘·마그네슘 보충)",
  "intakeMethod": "1일 2회, 1회 1정(또는 1캡슐)씩 물과 함께 섭취",
  "precautions": "임산부·수유부, 질환이 있거나 약물(특히 갑상선호르몬제, 테트라사이클린/퀴놀론계 항생제, 골다공증 치료제 등) 복용 중인 경우 전문가와 상담하세요. 칼슘·마그네슘은 일부 약물과 흡수 간섭이 있을 수 있어 2시간 이상 간격을 두는 것이 좋습니다. 고칼슘혈증/신장질환(신결석 포함) 병력이 있으면 섭취 전 상담하세요. 과다 섭취 시 위장불편, 변비(칼슘), 설사(마그네슘) 등이 나타날 수 있습니다.",
  "ingredients": [
    {
      "name": "칼슘",
      "amount": "500",
      "unit": "mg"
    },
    {
      "name": "마그네슘",
      "amount": "250",
      "unit": "mg"
    },
    {
      "name": "비타민D",
      "amount": "10",
      "unit": "μg"
    },
    {
      "name": "비타민K",
      "amount": "50",
      "unit": "μg"
    },
    {
      "name": "아연",
      "amount": "8",
      "unit": "mg"
    }
  ]
}
2026-02-07T00:34:53.106+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: ProductExtractionResponse(productName=올덤 칼슘앤마그네슘, primaryFunction=뼈와 치아 건강 유지, 신경·근육 기능 유지에 도움(칼슘·마그네슘 보충), intakeMethod=1일 2회, 1회 1정(또는 1캡슐)씩 물과 함께 섭취, precautions=임산부·수유부, 질환이 있거나 약물(특히 갑상선호르몬제, 테트라사이클린/퀴놀론계 항생제, 골다공증 치료제 등) 복용 중인 경우 전문가와 상담하세요. 칼슘·마그네슘은 일부 약물과 흡수 간섭이 있을 수 있어 2시간 이상 간격을 두는 것이 좋습니다. 고칼슘혈증/신장질환(신결석 포함) 병력이 있으면 섭취 전 상담하세요. 과다 섭취 시 위장불편, 변비(칼슘), 설사(마그네슘) 등이 나타날 수 있습니다., ingredients=[ProductExtractionResponse.IngredientInfo(name=칼슘, amount=500, unit=mg), ProductExtractionResponse.IngredientInfo(name=마그네슘, amount=250, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민D, amount=10, unit=μg), ProductExtractionResponse.IngredientInfo(name=비타민K, amount=50, unit=μg), ProductExtractionResponse.IngredientInfo(name=아연, amount=8, unit=mg)])
2026-02-07T00:34:53.107+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=ProductExtraction
2026-02-07T00:34:53.108+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : <<< [GMS 응답] productName=올덤 칼슘앤마그네슘, ingredients count=5
Hibernate: 
    insert 
    into
        product
        (iftkn_atnt_matr_cn, ntk_mthd, prdlst_nm, primary_fnclty) 
    values
        (?, ?, ?, ?)
2026-02-07T00:34:53.203+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] Product ID=43895, Name=올덤 칼슘앤마그네슘
2026-02-07T00:34:53.205+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 500 mg 칼슘
2026-02-07T00:34:53.205+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:34:53.205+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 500 mg 칼슘
2026-02-07T00:34:53.205+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 500 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:34:53.229+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 칼슘
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:34:53.267+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 250 mg 마그네슘
2026-02-07T00:34:53.267+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:34:53.267+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 250 mg 마그네슘
2026-02-07T00:34:53.268+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 250 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:34:53.284+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 10 μg 비타민D
2026-02-07T00:34:53.285+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:34:53.286+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 10 μg 비타민D
2026-02-07T00:34:53.286+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 10 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:34:53.300+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 50 μg 비타민K
2026-02-07T00:34:53.300+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:34:53.301+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 50 μg 비타민K
2026-02-07T00:34:53.301+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 50 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:34:53.308+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민K
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:34:53.322+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 8 mg 아연
2026-02-07T00:34:53.322+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:34:53.322+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 8 mg 아연
2026-02-07T00:34:53.322+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 8 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:34:53.340+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 처리 완료] 총 5 개 성분 저장됨
2026-02-07T00:34:53.340+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품1 - 제품/성분 추출 (LLM): 6404ms
2026-02-07T00:34:53.340+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [5단계] 섭취 시간 추천 조회: '올덤 칼슘앤마그네슘'
2026-02-07T00:34:53.340+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=IntakeTime, type=IntakeTimeResponse, temp=1.0
2026-02-07T00:34:53.340+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 478 chars
2026-02-07T00:34:54.539+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (59 bytes): {
  "intakeTime": "22:00:00",
  "category": "BEFORESLEEP"
}
2026-02-07T00:34:54.540+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=IntakeTimeResponse
2026-02-07T00:34:54.540+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "intakeTime": "22:00:00",
  "category": "BEFORESLEEP"
}
2026-02-07T00:34:54.540+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: IntakeTimeResponse(intakeTime=22:00:00, category=BEFORESLEEP)
2026-02-07T00:34:54.543+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=IntakeTime
2026-02-07T00:34:54.543+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [섭취 시간] intakeTime=22:00:00, category=BEFORESLEEP
2026-02-07T00:34:54.543+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품1 - 섭취시간 추천 (LLM): 1203ms
2026-02-07T00:34:54.546+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품1 - 총 처리 시간: 7743ms
2026-02-07T00:34:54.546+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [제품 2/4] 처리 시작: DALE Multi Vitamin & Mineral Premium
2026-02-07T00:34:54.546+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [0단계] 제품명 유효성 검증: 'DALE Multi Vitamin & Mineral Premium'
2026-02-07T00:34:54.547+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [검증 결과] 주요 키워드 포함 확인 -> 무조건 통과
2026-02-07T00:34:54.547+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품2 - 제품명 검증 (LLM): 1ms
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm=?
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm like ? escape '\\'
2026-02-07T00:34:54.655+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품2 - DB 검색: 107ms
2026-02-07T00:34:54.655+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [3단계] DB에 제품 없음 -> GMS 호출하여 제품 및 성분 저장
2026-02-07T00:34:54.655+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 호출] 제품 'DALE Multi Vitamin & Mineral Premium' 정보 추출 요청
2026-02-07T00:34:54.655+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=ProductExtraction, type=ProductExtractionResponse, temp=1.0
2026-02-07T00:34:54.655+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 1009 chars
2026-02-07T00:35:00.039+09:00  INFO 1728 --- [yaksok] [   noti-async-3] c.s.y.n.service.NotificationService      : 🔔 알람 전송 프로세스 시작 [현재 시각: 00:35:00.039429600]
Hibernate: 
    select
        count(n1_0.id) 
    from
        notification n1_0 
    where
        n1_0.enabled 
        and not(n1_0.intaken)
Hibernate: 
    select
        n1_0.id,
        n1_0.category,
        n1_0.created_at,
        n1_0.enabled,
        n1_0.intake_time,
        n1_0.intaken,
        n1_0.next_notify,
        n1_0.nickname,
        n1_0.user_id,
        n1_0.user_product_id 
    from
        notification n1_0 
    where
        n1_0.enabled=1 
        and n1_0.intaken=0 
        and n1_0.intake_time<=? 
        and (
            n1_0.next_notify is null 
            or n1_0.next_notify<=?
        )
2026-02-07T00:35:00.051+09:00  INFO 1728 --- [yaksok] [   noti-async-3] c.s.y.n.service.NotificationService      : 📊 알람 현황: 전체 미복용 알림=0건, 현재 발송 대상=0건
2026-02-07T00:35:00.051+09:00  INFO 1728 --- [yaksok] [   noti-async-3] c.s.y.n.service.NotificationService      : 알람 전송 프로세스 종료
2026-02-07T00:35:05.810+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (1401 bytes): {
  "productName": "DALE Multi Vitamin & Mineral Premium",
  "primaryFunction": "비타민·미네랄 보충을 통한 면역 기능 유지, 항산화, 에너지 대사 및 전반적인 영양 밸런스 지원",
  "intakeMethod": "일 1회 1정(또는 1캡슐) 물과 함께 섭취(식사 직후 권장)",
  "precautions": "임신·수유 중이거나 질환(간·신장 질환 등) 치료 중인 경우 전문가와 상담 후 섭취하세요. 항응고제 복용 중인 경우 비타민K(포함 가능) 및 비타민E 고함량 제품 섭취에 주의하세요. 지용성 비타민(A, D, E)은 과다 섭취하지 않도록 다른 영양제와 중복 섭취를 피하세요. 철(Fe) 함유 가능성이 있어 위장 불편감이 있을 수 있으며, 공복 섭취는 피하는 것이 좋습니다. 어린이 손이 닿지 않는 곳에 보관하세요.",
  "ingredients": [
    {
      "name": "비타민C",
      "am...
2026-02-07T00:35:05.810+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=ProductExtractionResponse
2026-02-07T00:35:05.810+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "productName": "DALE Multi Vitamin & Mineral Premium",
  "primaryFunction": "비타민·미네랄 보충을 통한 면역 기능 유지, 항산화, 에너지 대사 및 전반적인 영양 밸런스 지원",
  "intakeMethod": "일 1회 1정(또는 1캡슐) 물과 함께 섭취(식사 직후 권장)",
  "precautions": "임신·수유 중이거나 질환(간·신장 질환 등) 치료 중인 경우 전문가와 상담 후 섭취하세요. 항응고제 복용 중인 경우 비타민K(포함 가능) 및 비타민E 고함량 제품 섭취에 주의하세요. 지용성 비타민(A, D, E)은 과다 섭취하지 않도록 다른 영양제와 중복 섭취를 피하세요. 철(Fe) 함유 가능성이 있어 위장 불편감이 있을 수 있으며, 공복 섭취는 피하는 것이 좋습니다. 어린이 손이 닿지 않는 곳에 보관하세요.",
  "ingredients": [
    {
      "name": "비타민C",
      "amount": "1000",
      "unit": "mg"
    },
    {
      "name": "비타민D3",
      "amount": "25",
      "unit": "μg"
    },
    {
      "name": "비타민E",
      "amount": "15",
      "unit": "mg"
    },
    {
      "name": "비타민B1(티아민)",
      "amount": "50",
      "unit": "mg"
    },
    {
      "name": "비타민B2(리보플라빈)",
      "amount": "20",
      "unit": "mg"
    },
    {
      "name": "비타민B6",
      "amount": "25",
      "unit": "mg"
    },
    {
      "name": "비타민B12",
      "amount": "500",
      "unit": "μg"
    },
    {
      "name": "나이아신(B3)",
      "amount": "50",
      "unit": "mg"
    },
    {
      "name": "엽산",
      "amount": "400",
      "unit": "μg"
    },
    {
      "name": "아연",
      "amount": "10",
      "unit": "mg"
    },
    {
      "name": "마그네슘",
      "amount": "100",
      "unit": "mg"
    },
    {
      "name": "셀레늄",
      "amount": "55",
      "unit": "μg"
    }
  ]
}
2026-02-07T00:35:05.814+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: ProductExtractionResponse(productName=DALE Multi Vitamin & Mineral Premium, primaryFunction=비타민·미네랄 보충을 통한 면역 기능 유지, 항산화, 에너지 대사 및 전반적인 영양 밸런스 지원, intakeMethod=일 1회 1정(또는 1캡슐) 물과 함께 섭취(식사 직후 권장), precautions=임신·수유 중이거나 질환(간·신장 질환 등) 치료 중인 경우 전문가와 상담 후 섭취하세요. 항응고제 복용 중인 경우 비타민K(포함 가능) 및 비타민E 고함량 제품 섭취에 주의하세요. 지용성 비타민(A, D, E)은 과다 섭취하지 않도록 다른 영양제와 중복 섭취를 피하세요. 철(Fe) 함유 가능성이 있어 위장 불편감이 있을 수 있으며, 공복 섭취는 피하는 것이 좋습니다. 어린이 손이 닿지 않는 곳에 보관하세요., ingredients=[ProductExtractionResponse.IngredientInfo(name=비타민C, amount=1000, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민D3, amount=25, unit=μg), ProductExtractionResponse.IngredientInfo(name=비타민E, amount=15, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민B1(티아민), amount=50, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민B2(리보플라빈), amount=20, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민B6, amount=25, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민B12, amount=500, unit=μg), ProductExtractionResponse.IngredientInfo(name=나이아신(B3), amount=50, unit=mg), ProductExtractionResponse.IngredientInfo(name=엽산, amount=400, unit=μg), ProductExtractionResponse.IngredientInfo(name=아연, amount=10, unit=mg), ProductExtractionResponse.IngredientInfo(name=마그네슘, amount=100, unit=mg), ProductExtractionResponse.IngredientInfo(name=셀레늄, amount=55, unit=μg)])
2026-02-07T00:35:05.814+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=ProductExtraction
2026-02-07T00:35:05.814+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : <<< [GMS 응답] productName=DALE Multi Vitamin & Mineral Premium, ingredients count=12
Hibernate: 
    insert 
    into
        product
        (iftkn_atnt_matr_cn, ntk_mthd, prdlst_nm, primary_fnclty) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.819+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] Product ID=43896, Name=DALE Multi Vitamin & Mineral Premium
2026-02-07T00:35:05.820+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 1000 mg 비타민C
2026-02-07T00:35:05.820+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.820+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 1000 mg 비타민C
2026-02-07T00:35:05.820+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 1000 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.836+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 25 μg 비타민D3
2026-02-07T00:35:05.837+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.837+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 25 μg 비타민D3
2026-02-07T00:35:05.837+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 25 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:05.844+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민D3
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.858+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 15 mg 비타민E
2026-02-07T00:35:05.858+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.858+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 15 mg 비타민E
2026-02-07T00:35:05.858+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 15 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.873+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 50 mg 비타민B1(티아민)
2026-02-07T00:35:05.873+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.873+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 50 mg 비타민B1(티아민)
2026-02-07T00:35:05.873+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 50 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:05.879+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민B1(티아민)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.892+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 20 mg 비타민B2(리보플라빈)
2026-02-07T00:35:05.893+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.893+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 20 mg 비타민B2(리보플라빈)
2026-02-07T00:35:05.893+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 20 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:05.899+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민B2(리보플라빈)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.914+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 25 mg 비타민B6
2026-02-07T00:35:05.914+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.914+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 25 mg 비타민B6
2026-02-07T00:35:05.914+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 25 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.929+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 500 μg 비타민B12
2026-02-07T00:35:05.929+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.929+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 500 μg 비타민B12
2026-02-07T00:35:05.929+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 500 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.947+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 50 mg 나이아신(B3)
2026-02-07T00:35:05.949+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.949+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 50 mg 나이아신(B3)
2026-02-07T00:35:05.949+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 50 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:05.957+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 나이아신(B3)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.975+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 400 μg 엽산
2026-02-07T00:35:05.976+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.976+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 400 μg 엽산
2026-02-07T00:35:05.976+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 400 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:05.993+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 10 mg 아연
2026-02-07T00:35:05.993+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:05.993+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 10 mg 아연
2026-02-07T00:35:05.993+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 10 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:06.010+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 100 mg 마그네슘
2026-02-07T00:35:06.010+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:06.010+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 100 mg 마그네슘
2026-02-07T00:35:06.010+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 100 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:06.028+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 55 μg 셀레늄
2026-02-07T00:35:06.029+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:06.029+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 55 μg 셀레늄
2026-02-07T00:35:06.030+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 55 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:06.037+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 셀레늄
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:06.053+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 처리 완료] 총 12 개 성분 저장됨
2026-02-07T00:35:06.054+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품2 - 제품/성분 추출 (LLM): 11399ms
2026-02-07T00:35:06.054+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [5단계] 섭취 시간 추천 조회: 'DALE Multi Vitamin & Mineral Premium'
2026-02-07T00:35:06.054+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=IntakeTime, type=IntakeTimeResponse, temp=1.0
2026-02-07T00:35:06.054+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 504 chars
2026-02-07T00:35:07.180+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (57 bytes): {
  "intakeTime": "08:00:00",
  "category": "AFTERMEAL"
}
2026-02-07T00:35:07.181+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=IntakeTimeResponse
2026-02-07T00:35:07.181+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "intakeTime": "08:00:00",
  "category": "AFTERMEAL"
}
2026-02-07T00:35:07.182+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: IntakeTimeResponse(intakeTime=08:00:00, category=AFTERMEAL)
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=IntakeTime
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [섭취 시간] intakeTime=08:00:00, category=AFTERMEAL
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품2 - 섭취시간 추천 (LLM): 1128ms
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품2 - 총 처리 시간: 12636ms
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [제품 3/4] 처리 시작: Nutri D-DAY 오메가-3 골드 1100
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [0단계] 제품명 유효성 검증: 'Nutri D-DAY 오메가-3 골드 1100'
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [검증 결과] 주요 키워드 포함 확인 -> 무조건 통과
2026-02-07T00:35:07.182+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품3 - 제품명 검증 (LLM): 0ms
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm=?
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm like ? escape '\\'
2026-02-07T00:35:07.298+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품3 - DB 검색: 116ms
2026-02-07T00:35:07.298+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [3단계] DB에 제품 없음 -> GMS 호출하여 제품 및 성분 저장
2026-02-07T00:35:07.298+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 호출] 제품 'Nutri D-DAY 오메가-3 골드 1100' 정보 추출 요청
2026-02-07T00:35:07.298+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=ProductExtraction, type=ProductExtractionResponse, temp=1.0
2026-02-07T00:35:07.298+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 998 chars
2026-02-07T00:35:14.088+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (939 bytes): {
  "productName": "Nutri D-DAY 오메가-3 골드 1100",
  "primaryFunction": "혈중 중성지질 개선·혈행 개선 및 건조한 눈 개선(오메가-3 지방산)",
  "intakeMethod": "1일 1회, 1회 1캡슐을 물과 함께 섭취",
  "precautions": "항응고제/항혈소판제(예: 와파린, 아스피린) 복용 중이거나 수술 예정인 경우 전문가와 상담하십시오. 임신·수유부, 특정 질환(간/신장, 출혈성 질환 등)이 있는 경우 섭취 전 전문가와 상담하십시오. 생선 및 해산물 알레르기가 있는 경우 원료를 확인하십시오. 이상 증상(복통, 설사, 메스꺼움, 알레르기 반응 등) 발생 시 섭취를 중단하고 상담하십시오. 직사광선을 피해 서늘한 곳에 보관하고, 어린이 손이 닿지 않게 보관하십시오.",
  "ingredients": [
    {
      "name": "오메가-3 지방산(EPA)",
      "amount": "660",
    ...
2026-02-07T00:35:14.088+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=ProductExtractionResponse
2026-02-07T00:35:14.088+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "productName": "Nutri D-DAY 오메가-3 골드 1100",
  "primaryFunction": "혈중 중성지질 개선·혈행 개선 및 건조한 눈 개선(오메가-3 지방산)",
  "intakeMethod": "1일 1회, 1회 1캡슐을 물과 함께 섭취",
  "precautions": "항응고제/항혈소판제(예: 와파린, 아스피린) 복용 중이거나 수술 예정인 경우 전문가와 상담하십시오. 임신·수유부, 특정 질환(간/신장, 출혈성 질환 등)이 있는 경우 섭취 전 전문가와 상담하십시오. 생선 및 해산물 알레르기가 있는 경우 원료를 확인하십시오. 이상 증상(복통, 설사, 메스꺼움, 알레르기 반응 등) 발생 시 섭취를 중단하고 상담하십시오. 직사광선을 피해 서늘한 곳에 보관하고, 어린이 손이 닿지 않게 보관하십시오.",
  "ingredients": [
    {
      "name": "오메가-3 지방산(EPA)",
      "amount": "660",
      "unit": "mg"
    },
    {
      "name": "오메가-3 지방산(DHA)",
      "amount": "440",
      "unit": "mg"
    },
    {
      "name": "비타민 E(알파-토코페롤)",
      "amount": "11",
      "unit": "mg"
    },
    {
      "name": "젤라틴(캡슐)",
      "amount": "200",
      "unit": "mg"
    },
    {
      "name": "글리세린(캡슐)",
      "amount": "100",
      "unit": "mg"
    },
    {
      "name": "정제수(캡슐)",
      "amount": "50",
      "unit": "mg"
    }
  ]
}
2026-02-07T00:35:14.089+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: ProductExtractionResponse(productName=Nutri D-DAY 오메가-3 골드 1100, primaryFunction=혈중 중성지질 개선·혈행 개선 및 건조한 눈 개선(오메가-3 지방산), intakeMethod=1일 1회, 1회 1캡슐을 물과 함께 섭취, precautions=항응고제/항혈소판제(예: 와파린, 아스피린) 복용 중이거나 수술 예정인 경우 전문가와 상담하십시오. 임신·수유부, 특정 질환(간/신장, 출혈성 질환 등)이 있는 경우 섭취 전 전문가와 상담하십시오. 생선 및 해산물 알레르기가 있는 경우 원료를 확인하십시오. 이상 증상(복통, 설사, 메스꺼움, 알레르기 반응 등) 발생 시 섭취를 중단하고 상담하십시오. 직사광선을 피해 서늘한 곳에 보관하고, 어린이 손이 닿지 않게 보관하십시오., ingredients=[ProductExtractionResponse.IngredientInfo(name=오메가-3 지방산(EPA), amount=660, unit=mg), ProductExtractionResponse.IngredientInfo(name=오메가-3 지방산(DHA), amount=440, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민 E(알파-토코페롤), amount=11, unit=mg), ProductExtractionResponse.IngredientInfo(name=젤라틴(캡슐), amount=200, unit=mg), ProductExtractionResponse.IngredientInfo(name=글리세린(캡슐), amount=100, unit=mg), ProductExtractionResponse.IngredientInfo(name=정제수(캡슐), amount=50, unit=mg)])
2026-02-07T00:35:14.089+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=ProductExtraction
2026-02-07T00:35:14.089+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : <<< [GMS 응답] productName=Nutri D-DAY 오메가-3 골드 1100, ingredients count=6
Hibernate: 
    insert 
    into
        product
        (iftkn_atnt_matr_cn, ntk_mthd, prdlst_nm, primary_fnclty) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.093+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] Product ID=43897, Name=Nutri D-DAY 오메가-3 골드 1100
2026-02-07T00:35:14.094+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 660 mg 오메가-3 지방산(EPA)
2026-02-07T00:35:14.094+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:14.094+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 660 mg 오메가-3 지방산(EPA)
2026-02-07T00:35:14.094+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 660 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:14.099+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 오메가-3 지방산(EPA)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.111+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 440 mg 오메가-3 지방산(DHA)
2026-02-07T00:35:14.113+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:14.113+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 440 mg 오메가-3 지방산(DHA)
2026-02-07T00:35:14.113+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 440 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:14.119+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 오메가-3 지방산(DHA)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.131+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 11 mg 비타민 E(알파-토코페롤)
2026-02-07T00:35:14.132+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:14.132+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 11 mg 비타민 E(알파-토코페롤)
2026-02-07T00:35:14.132+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 11 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:14.136+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민 E(알파-토코페롤)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.149+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 200 mg 젤라틴(캡슐)
2026-02-07T00:35:14.149+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:14.149+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 200 mg 젤라틴(캡슐)
2026-02-07T00:35:14.149+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 200 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:14.155+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 젤라틴(캡슐)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.169+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 100 mg 글리세린(캡슐)
2026-02-07T00:35:14.169+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:14.169+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 100 mg 글리세린(캡슐)
2026-02-07T00:35:14.169+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 100 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:14.174+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 글리세린(캡슐)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.187+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 50 mg 정제수(캡슐)
2026-02-07T00:35:14.188+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:14.188+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 50 mg 정제수(캡슐)
2026-02-07T00:35:14.188+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 50 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:14.194+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 정제수(캡슐)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:14.209+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 처리 완료] 총 6 개 성분 저장됨
2026-02-07T00:35:14.210+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품3 - 제품/성분 추출 (LLM): 6912ms
2026-02-07T00:35:14.210+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [5단계] 섭취 시간 추천 조회: 'Nutri D-DAY 오메가-3 골드 1100'
2026-02-07T00:35:14.210+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=IntakeTime, type=IntakeTimeResponse, temp=1.0
2026-02-07T00:35:14.210+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 493 chars
2026-02-07T00:35:15.327+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (57 bytes): {
  "intakeTime": "08:00:00",
  "category": "AFTERMEAL"
}
2026-02-07T00:35:15.327+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=IntakeTimeResponse
2026-02-07T00:35:15.328+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "intakeTime": "08:00:00",
  "category": "AFTERMEAL"
}
2026-02-07T00:35:15.328+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: IntakeTimeResponse(intakeTime=08:00:00, category=AFTERMEAL)
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=IntakeTime
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [섭취 시간] intakeTime=08:00:00, category=AFTERMEAL
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품3 - 섭취시간 추천 (LLM): 1118ms
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품3 - 총 처리 시간: 8146ms
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [제품 4/4] 처리 시작: FA 눈건강 비타민A
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [0단계] 제품명 유효성 검증: 'FA 눈건강 비타민A'
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [검증 결과] 주요 키워드 포함 확인 -> 무조건 통과
2026-02-07T00:35:15.328+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품4 - 제품명 검증 (LLM): 0ms
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm=?
Hibernate: 
    select
        p1_0.id,
        p1_0.iftkn_atnt_matr_cn,
        p1_0.ntk_mthd,
        p1_0.prdlst_nm,
        p1_0.primary_fnclty 
    from
        product p1_0 
    where
        p1_0.prdlst_nm like ? escape '\\'
2026-02-07T00:35:15.440+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품4 - DB 검색: 112ms
2026-02-07T00:35:15.440+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [3단계] DB에 제품 없음 -> GMS 호출하여 제품 및 성분 저장
2026-02-07T00:35:15.440+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 호출] 제품 'FA 눈건강 비타민A' 정보 추출 요청
2026-02-07T00:35:15.440+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=ProductExtraction, type=ProductExtractionResponse, temp=1.0
2026-02-07T00:35:15.440+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 984 chars
2026-02-07T00:35:21.843+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (942 bytes): {
  "productName": "FA 눈건강 비타민A",
  "primaryFunction": "눈 건강 지원(야간 시력 적응 및 시각 기능 유지), 항산화 도움",
  "intakeMethod": "1일 1회 1캡슐을 물과 함께 섭취",
  "precautions": "임산부·수유부는 섭취 전 전문가와 상담하십시오. 비타민A는 과다 섭취 시 두통, 구역, 피부 건조 등 이상 반응이 나타날 수 있으므로 권장량을 초과하지 마십시오. 항응고제 복용 중이거나 수술 전후, 지질저하제(콜레스테롤 약) 복용 중인 경우 상담 후 섭취하십시오. 특정 성분에 알레르기가 있는 경우 원료를 확인 후 섭취하십시오. 이상 반응 발생 시 섭취를 중단하고 전문가와 상담하십시오.",
  "ingredients": [
    {
      "name": "비타민A(레티닐팔미테이트)",
      "amount": "700",
      "unit": "μg"
    },
    {
      "name": "...
2026-02-07T00:35:21.844+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=ProductExtractionResponse
2026-02-07T00:35:21.844+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "productName": "FA 눈건강 비타민A",
  "primaryFunction": "눈 건강 지원(야간 시력 적응 및 시각 기능 유지), 항산화 도움",
  "intakeMethod": "1일 1회 1캡슐을 물과 함께 섭취",
  "precautions": "임산부·수유부는 섭취 전 전문가와 상담하십시오. 비타민A는 과다 섭취 시 두통, 구역, 피부 건조 등 이상 반응이 나타날 수 있으므로 권장량을 초과하지 마십시오. 항응고제 복용 중이거나 수술 전후, 지질저하제(콜레스테롤 약) 복용 중인 경우 상담 후 섭취하십시오. 특정 성분에 알레르기가 있는 경우 원료를 확인 후 섭취하십시오. 이상 반응 발생 시 섭취를 중단하고 전문가와 상담하십시오.",
  "ingredients": [
    {
      "name": "비타민A(레티닐팔미테이트)",
      "amount": "700",
      "unit": "μg"
    },
    {
      "name": "루테인",
      "amount": "10",
      "unit": "mg"
    },
    {
      "name": "지아잔틴",
      "amount": "2",
      "unit": "mg"
    },
    {
      "name": "비타민E(α-토코페롤)",
      "amount": "11",
      "unit": "mg"
    },
    {
      "name": "아연",
      "amount": "8",
      "unit": "mg"
    },
    {
      "name": "비타민C",
      "amount": "100",
      "unit": "mg"
    },
    {
      "name": "셀레늄",
      "amount": "55",
      "unit": "μg"
    }
  ]
}
2026-02-07T00:35:21.845+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: ProductExtractionResponse(productName=FA 눈건강 비타민A, primaryFunction=눈 건강 지원(야간 시력 적응 및 시각 기능 유지), 항산화 도움, intakeMethod=1일 1회 1캡슐을 물과 함께 섭취, precautions=임산부·수유부는 섭취 전 전문가와 상담하십시오. 비타민A는 과다 섭취 시 두통, 구역, 피부 건조 등 이상 반응이 나타날 수 있으므로 권장량을 초과하지 마십시오. 항응고제 복용 중이거나 수술 전후, 지질저하제(콜레스테롤 약) 복용 중인 경우 상담 후 섭취하십시오. 특정 성분에 알레르기가 있는 경우 원료를 확인 후 섭취하십시오. 이상 반응 발생 시 섭취를 중단하고 전문가와 상담하십시오., ingredients=[ProductExtractionResponse.IngredientInfo(name=비타민A(레티닐팔미테이트), amount=700, unit=μg), ProductExtractionResponse.IngredientInfo(name=루테인, amount=10, unit=mg), ProductExtractionResponse.IngredientInfo(name=지아잔틴, amount=2, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민E(α-토코페롤), amount=11, unit=mg), ProductExtractionResponse.IngredientInfo(name=아연, amount=8, unit=mg), ProductExtractionResponse.IngredientInfo(name=비타민C, amount=100, unit=mg), ProductExtractionResponse.IngredientInfo(name=셀레늄, amount=55, unit=μg)])
2026-02-07T00:35:21.845+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=ProductExtraction
2026-02-07T00:35:21.845+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : <<< [GMS 응답] productName=FA 눈건강 비타민A, ingredients count=7
Hibernate: 
    insert 
    into
        product
        (iftkn_atnt_matr_cn, ntk_mthd, prdlst_nm, primary_fnclty) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.849+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] Product ID=43898, Name=FA 눈건강 비타민A
2026-02-07T00:35:21.850+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 700 μg 비타민A(레티닐팔미테이트)
2026-02-07T00:35:21.850+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.850+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 700 μg 비타민A(레티닐팔미테이트)
2026-02-07T00:35:21.850+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 700 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:21.857+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민A(레티닐팔미테이트)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.868+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 10 mg 루테인
2026-02-07T00:35:21.870+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.870+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 10 mg 루테인
2026-02-07T00:35:21.870+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 10 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:21.876+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 루테인
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.890+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 2 mg 지아잔틴
2026-02-07T00:35:21.890+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.890+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 2 mg 지아잔틴
2026-02-07T00:35:21.891+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 2 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:21.897+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 지아잔틴
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.912+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 11 mg 비타민E(α-토코페롤)
2026-02-07T00:35:21.912+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.912+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 11 mg 비타민E(α-토코페롤)
2026-02-07T00:35:21.912+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 11 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
2026-02-07T00:35:21.918+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [DB 저장] 새로운 성분 등록: 비타민E(α-토코페롤)
Hibernate: 
    insert 
    into
        ingredient
        (display_unit, ingredient_name, max_intake_value, min_intake_value) 
    values
        (?, ?, ?, ?)
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.930+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 8 mg 아연
2026-02-07T00:35:21.930+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.930+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 8 mg 아연
2026-02-07T00:35:21.930+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 8 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.943+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 100 mg 비타민C
2026-02-07T00:35:21.945+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.945+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 100 mg 비타민C
2026-02-07T00:35:21.945+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 100 mg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.960+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 변환 시도: 55 μg 셀레늄
2026-02-07T00:35:21.960+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.global.common.unit.IUConverter     : [IUConverter] 다음 변환기로 위임
2026-02-07T00:35:21.960+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 변환 시도: 55 μg 셀레늄
2026-02-07T00:35:21.960+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.unit.StandardUnitConverter     : [StandardUnitConverter] 이미 표준 단위: 55 μg
Hibernate: 
    select
        i1_0.id,
        i1_0.display_unit,
        i1_0.ingredient_name,
        i1_0.max_intake_value,
        i1_0.min_intake_value 
    from
        ingredient i1_0 
    where
        i1_0.ingredient_name=?
Hibernate: 
    select
        pi1_0.id 
    from
        product_ingredient pi1_0 
    where
        pi1_0.product_id=? 
        and pi1_0.ingredient_id=? 
    limit
        ?
Hibernate: 
    insert 
    into
        product_ingredient
        (amount_unit, ingredient_id, ingredient_amount, product_id) 
    values
        (?, ?, ?, ?)
2026-02-07T00:35:21.977+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : >>> [GMS 처리 완료] 총 7 개 성분 저장됨
2026-02-07T00:35:21.977+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품4 - 제품/성분 추출 (LLM): 6537ms
2026-02-07T00:35:21.977+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [5단계] 섭취 시간 추천 조회: 'FA 눈건강 비타민A'
2026-02-07T00:35:21.977+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 시작: template=IntakeTime, type=IntakeTimeResponse, temp=1.0
2026-02-07T00:35:21.977+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : >>> [LLM] 프롬프트 생성 완료, 길이: 479 chars
2026-02-07T00:35:22.875+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : <<< [LLM] 원시 응답 수신 (57 bytes): {
  "intakeTime": "08:00:00",
  "category": "AFTERMEAL"
}
2026-02-07T00:35:22.875+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 시작: targetType=IntakeTimeResponse
2026-02-07T00:35:22.875+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : 정제된 JSON: {
  "intakeTime": "08:00:00",
  "category": "AFTERMEAL"
}
2026-02-07T00:35:22.875+09:00 DEBUG 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.parser.LLMResponseParser   : LLM 응답 파싱 완료: IntakeTimeResponse(intakeTime=08:00:00, category=AFTERMEAL)
2026-02-07T00:35:22.875+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.g.c.llm.prompt.LLMServiceFacade    : LLM 호출 완료: template=IntakeTime
2026-02-07T00:35:22.875+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       :     [섭취 시간] intakeTime=08:00:00, category=AFTERMEAL
2026-02-07T00:35:22.875+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품4 - 섭취시간 추천 (LLM): 898ms
2026-02-07T00:35:22.878+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 제품4 - 총 처리 시간: 7550ms
2026-02-07T00:35:22.878+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.service.OcrAnalysisService       : [성능측정] 전체 제품 처리 완료: 36143ms, 4 개 제품
2026-02-07T00:35:22.909+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.analyze.service.AnalyzeService     : [성능측정] 비즈니스 로직 처리 완료: 36177ms
2026-02-07T00:35:22.909+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.analyze.service.AnalyzeService     : [성능측정] 전체 분석 완료: 39881ms
2026-02-07T00:35:22.909+09:00  INFO 1728 --- [yaksok] [nio-8080-exec-1] c.s.y.a.controller.AnalyzeController     : 영양제 분석 API 호출 완료: User ID=1, 소요 시간=39881ms, Response=SupplementAnalysisResponse(reportData=SupplementAnalysisResponse.ReportData(products=[SupplementAnalysisResponse.ReportProductInfo(productId=43895, name=올덤 칼슘앤마그네슘, box=[0.01373291015625, 0.4609375, 0.255859375, 0.7890625], ingredients=[SupplementAnalysisResponse.ProductIngredientInfo(name=칼슘, amount=500.00, unit=mg, myAmount=0.00, totalAmount=500.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=마그네슘, amount=250.00, unit=mg, myAmount=0.00, totalAmount=250.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민D, amount=10.00, unit=μg, myAmount=0.00, totalAmount=10.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민K, amount=50.00, unit=μg, myAmount=0.00, totalAmount=50.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=아연, amount=8.00, unit=mg, myAmount=0.00, totalAmount=8.00, status=safe)], intakeTime=22:00:00, intakeCategory=BEFORESLEEP), SupplementAnalysisResponse.ReportProductInfo(productId=43896, name=DALE Multi Vitamin & Mineral Premium, box=[0.46484375, 0.400390625, 0.74609375, 0.8125], ingredients=[SupplementAnalysisResponse.ProductIngredientInfo(name=비타민C, amount=1000.00, unit=mg, myAmount=0.00, totalAmount=1000.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민D3, amount=25.00, unit=μg, myAmount=0.00, totalAmount=25.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민E, amount=15.00, unit=mg, myAmount=0.00, totalAmount=15.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민B1(티아민), amount=50.00, unit=mg, myAmount=0.00, totalAmount=50.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민B2(리보플라빈), amount=20.00, unit=mg, myAmount=0.00, totalAmount=20.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민B6, amount=25.00, unit=mg, myAmount=0.00, totalAmount=25.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민B12, amount=500.00, unit=μg, myAmount=0.00, totalAmount=500.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=나이아신(B3), amount=50.00, unit=mg, myAmount=0.00, totalAmount=50.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=엽산, amount=400.00, unit=μg, myAmount=0.00, totalAmount=400.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=아연, amount=10.00, unit=mg, myAmount=0.00, totalAmount=10.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=마그네슘, amount=100.00, unit=mg, myAmount=0.00, totalAmount=100.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=셀레늄, amount=55.00, unit=μg, myAmount=0.00, totalAmount=55.00, status=safe)], intakeTime=08:00:00, intakeCategory=AFTERMEAL), SupplementAnalysisResponse.ReportProductInfo(productId=43897, name=Nutri D-DAY 오메가-3 골드 1100, box=[0.73046875, 0.4609375, 0.9921875, 0.8203125], ingredients=[SupplementAnalysisResponse.ProductIngredientInfo(name=오메가-3 지방산(EPA), amount=660.00, unit=mg, myAmount=0.00, totalAmount=660.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=오메가-3 지방산(DHA), amount=440.00, unit=mg, myAmount=0.00, totalAmount=440.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민 E(알파-토코페롤), amount=11.00, unit=mg, myAmount=0.00, totalAmount=11.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=젤라틴(캡슐), amount=200.00, unit=mg, myAmount=0.00, totalAmount=200.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=글리세린(캡슐), amount=100.00, unit=mg, myAmount=0.00, totalAmount=100.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=정제수(캡슐), amount=50.00, unit=mg, myAmount=0.00, totalAmount=50.00, status=safe)], intakeTime=08:00:00, intakeCategory=AFTERMEAL), SupplementAnalysisResponse.ReportProductInfo(productId=43898, name=FA 눈건강 비타민A, box=[0.2353515625, 0.4609375, 0.474609375, 0.8125], ingredients=[SupplementAnalysisResponse.ProductIngredientInfo(name=비타민A(레티닐팔미테이트), amount=700.00, unit=μg, myAmount=0.00, totalAmount=700.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=루테인, amount=10.00, unit=mg, myAmount=0.00, totalAmount=10.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=지아잔틴, amount=2.00, unit=mg, myAmount=0.00, totalAmount=2.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민E(α-토코페롤), amount=11.00, unit=mg, myAmount=0.00, totalAmount=11.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=아연, amount=8.00, unit=mg, myAmount=0.00, totalAmount=8.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=비타민C, amount=100.00, unit=mg, myAmount=0.00, totalAmount=100.00, status=safe), SupplementAnalysisResponse.ProductIngredientInfo(name=셀레늄, amount=55.00, unit=μg, myAmount=0.00, totalAmount=55.00, status=safe)], intakeTime=08:00:00, intakeCategory=AFTERMEAL)]))
2026-02-07T00:36:00.026+09:00  INFO 1728 --- [yaksok] [   noti-async-4] c.s.y.n.service.NotificationService      : 🔔 알람 전송 프로세스 시작 [현재 시각: 00:36:00.026965200]
Hibernate: 

---
```