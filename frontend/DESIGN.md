# 약속 디자인 시스템

화면을 만들거나 고칠 때 이 문서를 먼저 본다. 토큰은 `src/styles/tokens.css`(v1)와 `src/app/globals.css`에 있다.

## 원칙

1. 색, 글자 크기, 굵기, 모서리, 쌓임 순서는 토큰(`var(--…)`)으로만 쓴다. 새 코드에 `#hex`, `rgba()`, 숫자 크기를 직접 쓰지 않는다.
2. 필요한 값이 토큰에 없으면 화면에서 만들지 말고 `tokens.css`에 먼저 추가한다. 이름은 쓰임새로 짓는다 (`--color-danger-fg`, `--radius-card`).
3. 화면은 한 번에 하나씩 옮긴다. 옮길 때마다 아래 "화면 비교"를 돌려 바뀐 곳이 없거나, 바뀐 곳이 의도한 것인지 확인한다.
4. 값을 바꾸는 일(예: 둥글기 18px → 20px로 통일)과 토큰으로 옮기는 일을 한 커밋에 섞지 않는다. 옮기기는 화면이 그대로여야 하고, 값 바꾸기는 비교 결과를 PR에 붙인다.

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
- 상태: `--color-success-fg/bg`, `--color-positive`, `--color-warning-fg/bg`, `--color-caution-fg/bg`, `--color-danger`, `--color-danger-fg/bg`, `--color-neutral`, `--overlay`
- 그라데이션: `--gradient-cta`(가운데 찍기 버튼), `--gradient-hero`(다음 알림 카드)
- 카메라·스캔 화면은 항상 어둡다: `--scan-*`

### 쌓임 순서

`--z-raised` 1 · `--z-sticky` 50 (화면 아래 고정 버튼) · `--z-tabbar` 100 · `--z-modal` 1000 (모달, 시트)

`.app-content`에 `transform`이나 `z-index`를 주지 않는다. 안의 `position: fixed`가 화면 대신 그 상자에 붙고 모달이 탭바 아래에 갇힌다.

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

| 화면 | 상태 | 남은 직접 값 |
|---|---|---|
| 알림 (`features/alarms`) | 옮김 (차이 0) | 글자 .95/1.05/1.15/1.9/2rem, 그림자 1개 |
| 스캔 (`features/scan`) | 옮김 (차이 0) | 글자 .78/.8/.92/1.05/1.15rem, 둥글기 10/18/22px, 스캔 빛 1개 |
| 리포트 (`features/report/report.css`) | 옮김 (차이 0) | 글자 .78/.88/1.05/1.15/1.7rem, 둥글기 18px |
| 탭바 (`layout/BottomTabBar`) | 옮김 (차이 0) | 글자 .72rem, 그림자 1개 |
| 홈, 내 영양제, 설정, 마이페이지, 로그인·가입, 카메라 촬영 | 아직 | 145가지 색 중 대부분, 인라인 `style` 147곳 |

남은 직접 값은 단계에 없는 값이다. 가장 가까운 단계로 바꾸면 화면이 조금 달라지므로, 값 정리 PR에서 비교 결과와 함께 바꾼다.
