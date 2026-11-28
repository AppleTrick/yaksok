# 약속 디자인 시스템

화면을 만들거나 고칠 때 이 문서를 먼저 본다. 토큰은 `src/styles/tokens.css`(v1)와 `src/app/globals.css`에 있다.

## 원칙

1. 색, 글자 크기, 굵기, 모서리, 쌓임 순서는 토큰(`var(--…)`)으로만 쓴다. 새 코드에 `#hex`, `rgba()`, 숫자 크기를 직접 쓰지 않는다.
2. 필요한 값이 토큰에 없으면 화면에서 만들지 말고 `tokens.css`에 먼저 추가한다. 이름은 쓰임새로 짓는다 (`--color-danger-fg`, `--radius-card`).
3. 화면은 한 번에 하나씩 옮긴다. 옮길 때마다 아래 "화면 비교"를 돌려 바뀐 곳이 없거나, 바뀐 곳이 의도한 것인지 확인한다.
4. 휴대폰은 접는 폰 바깥 화면(280px)부터 태블릿·가로까지 모양이 다양하다. 폭·높이를 숫자로 고정하지 말고 아래 "화면 틀" 토큰과 `clamp()`, `@container`로 짠다.
5. 값을 바꾸는 일(예: 둥글기 18px → 20px로 통일)과 토큰으로 옮기는 일을 한 커밋에 섞지 않는다. 옮기기는 화면이 그대로여야 하고, 값 바꾸기는 비교 결과를 PR에 붙인다.

## 토큰

### 글자

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--fs-xs` | .75rem | 탭바 글자, 작은 표시 |
| `--fs-sm` | .85rem | 보조 설명 |
| `--fs-md` | .9rem | 본문 보조, 안내 |
| `--fs-base` | 1rem | 본문 |
| `--fs-lg` | 1.1rem | 화면 제목(작은 머리글) |
| `--fs-xl` | 1.25rem | 소제목 |
| `--fs-2xl` | 1.4rem | 강조 숫자 |
| `--fs-3xl` | 1.75rem | 큰 숫자 |
| `--fs-4xl` | 2.1rem | 가장 큰 숫자 (다음 알림 시각) |

굵기: `--fw-medium` 500, `--fw-semibold` 600, `--fw-bold` 700, `--fw-heavy` 800

### 모서리

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--radius-sm` | 8px | 작은 배지 |
| `--radius-md` | 12px | 작은 버튼, 칸 |
| `--radius-control` | 14px | 버튼, 입력창 |
| `--radius-xl` | 16px | 작은 카드 |
| `--radius-card` | 20px | 카드 |
| `--radius-2xl` | 24px | 큰 카드 |
| `--radius-sheet` | 28px | 아래에서 올라오는 시트 |
| `--radius-pill` | 999px | 알약 모양 |
| `--radius-round` | 50% | 원 |

### 색

- 바탕·글자·브랜드: `--background-color`, `--surface-1`, `--foreground-color`, `--text-muted`, `--primary-color`, `--brand-strong`(흰 글자를 올리는 주황), `--tint`, `--border-color` (밝은·어두운 모드가 `globals.css`에서 바뀐다)
- 상태: 어두운 화면에서는 글자색이 밝아진다 (`tokens.css`의 `[data-theme='dark']`). `--color-success-fg/bg`, `--color-positive`, `--color-warning-fg/bg`, `--color-caution-fg/bg`, `--color-danger`, `--color-danger-fg/bg`, `--color-neutral`, `--overlay`
- 입력칸: `--field-bg`, `--field-border` (회색 바탕 위에서도 칸이 보이게)
- 시간대: `--slot-morning`, `--slot-lunch`, `--slot-night` (홈 복용 일정)
- 그라데이션: `--gradient-cta`(가운데 찍기 버튼), `--gradient-hero`(다음 알림 카드)
- 카메라·스캔 화면은 항상 어둡다: `--scan-*`

### 쌓임 순서

`--z-raised` 1 · `--z-sticky` 50 (화면 아래 고정 버튼) · `--z-tabbar` 100 · `--z-modal` 1000 (모달, 시트)

`.app-content`에 `transform`이나 `z-index`를 주지 않는다. 안의 `position: fixed`가 화면 대신 그 상자에 붙고 모달이 탭바 아래에 갇힌다.

## 화면 틀

| 토큰 | 기본 | 바뀌는 때 |
|---|---|---|
| `--app-max` | 480px | 태블릿·펼친 폴드(폭 700 이상, 높이 600 이상) 600px |
| `--page-x` | `clamp(14px, 5vw, 24px)` | 폭 340 이하 12px |
| `--tabbar-h` | 72px | 휴대폰 가로(높이 500 이하) 52px |
| `--safe-bottom` | 아이폰 홈 막대 높이 | |
| `--tabbar-space` | 탭바 + 홈 막대 | 화면 아래 여백은 `calc(var(--tabbar-space) + 28px)` |
| `--fixed-edge` | 앱 기둥 바깥 여백 | 떠 있는 버튼은 `right: calc(var(--fixed-edge) + var(--page-x))` |
| `--screen-h` | `100dvh` (안 되면 `100vh`) | 주소창이 접혀도 맞는 높이 |

- `100vh`, `480px`, `bottom: 85px`처럼 틀 값을 직접 쓰지 않는다.
- 카드 안 배치는 화면 폭이 아니라 카드 폭으로 바꾼다: 카드에 `container-type: inline-size`, 안에서 `@container (max-width: 250px)`. 예: `features/home/home.css`
- 모달·시트는 `max-height`를 `--screen-h` 기준으로 두고 넘치면 안에서 스크롤한다.
- 버튼 여러 개가 한 줄에 있으면 `flex-wrap`으로 넘긴다. 글자가 두 줄로 깨지지 않게 `white-space: nowrap`.
- 누르는 것은 44px 이상 (글자 링크 포함).

## 크기 검사 (화면을 바꿀 때마다)

```bash
node tools/visual/responsive.cjs ../.visual/resp            # 7가지 크기 전부
node tools/visual/responsive.cjs ../.visual/resp fold,land  # 일부만
```

접는 폰 바깥 화면 280×653, 작은 폰 320×568, 안드로이드 360×780, iPhone 390×844, 큰 폰 430×932, 휴대폰 가로 844×390, 태블릿 768×1024로 모든 화면을 찍는다. 가로로 밀림, 화면 밖으로 나감, 글자 잘림, 누르기 작음(32px 미만), 글자 너무 작음(11px 미만), 맨 아래까지 내려도 탭바에 가려짐을 센다. 결과는 `report.json`과 크기별 PNG.

알려진 예외: 스캔 사진 위 번호표(`.sc-tag`)는 `::after`로 누르는 범위를 넓혀 두어 실제로는 45px 정도지만 검사에는 작게 나온다. 모달이 열린 화면의 "가려짐"은 뒤 화면이 스크롤되지 않아 생기는 것이다.

## 화면 비교 (옮길 때마다)

```bash
cd frontend
npm run build && npx next start -p 3000          # 다른 터미널
node tools/visual/capture.cjs ../.visual/before  # 바꾸기 전 커밋에서
node tools/visual/capture.cjs ../.visual/after   # 바꾼 뒤
python tools/visual/diff.py ../.visual/before ../.visual/after ../.visual/diff
```

- 17개 화면을 밝은·어두운 모드로 찍는다 (34장). API는 가짜 데이터, 날짜는 2026-11-25 08:30으로 고정한다.
- `playwright-core`와 Chrome(`CHROME_CHANNEL=chrome`), Python Pillow가 필요하다.
- 같은 코드를 두 번 찍으면 0장이 달라야 정상이다. 분석에 걸린 시간처럼 매번 바뀌는 글자는 가린다.

## 옮긴 상태

| 화면 | 상태 |
|---|---|
| 알림, 스캔, 리포트, 탭바 | 토큰 (v1), 크기별 수정 |
| 홈 (`features/home/home.css`) | **새로 짬**: 토큰만, `@container` |
| 내 영양제 | 크기별 수정 (+ 버튼, 모달 버튼), 상태 색 토큰 |
| 설정·마이페이지·알림 설정, 로그인·가입·비밀번호 찾기, 카메라, 공용 부품 | 글자·굵기·둥글기 토큰 (같은 값만), 입력칸 |

남은 직접 값: 색(`#hex`, `rgba`)과 단계에 없는 글자 크기가 화면별 CSS에 남아 있다. 가장 가까운 단계로 바꾸면 화면이 조금 달라지므로, 화면 하나씩 비교 결과와 함께 바꾼다.
