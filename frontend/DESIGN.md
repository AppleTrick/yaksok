# 약속 디자인 시스템

화면을 만들거나 고칠 때 이 문서와 `frontend/AGENTS.md`(Astryx 안내)를 먼저 본다.

약속은 [Astryx](https://github.com/meta/astryx)(Meta의 오픈소스 디자인 시스템, MIT) 위에 약속 테마(`yaksok`)를 얹어 쓴다.

| 무엇 | 어디 |
|---|---|
| 부품 | `@astryxdesign/core` (버전을 고정했다: 0.7.17, 아직 베타) |
| 약속 테마 원본 | `frontend/themes/yaksok/` (테마 편집기로 고친다) |
| 앱이 읽는 테마 | `src/themes/yaksok/`, `src/astryx-themes.ts` (자동 생성, 손대지 않는다) |
| 테마·언어 연결 | `src/app/AstryxRoot.tsx` (한국어, 밝은·어두운 모드) |
| 화면 틀 토큰 | `src/styles/tokens.css` |
| 글꼴 | Pretendard Variable (`pretendard` 패키지, 한글 포함, OFL) |

## 원칙

1. **Astryx 부품부터 쓴다.** 글자는 `Text`·`Heading`, 배치는 `VStack`·`HStack`, 묶음은 `Card`, 목록은 `List`·`ListItem`, 입력은 `TextInput`·`TimeInput`·`Selector`·`SegmentedControl`·`ToggleButtonGroup`·`Switch`, 창은 `Dialog`·`AlertDialog`·`BottomSheet`, 안내는 `Banner`·`EmptyState`. 부품 사용법은 `npx astryx component <이름>`으로 확인한다.
2. **색·크기·모서리는 테마가 정한다.** 화면에서 `#hex`, `rgba()`, 숫자 크기를 쓰지 않는다. 꼭 필요하면 Astryx 토큰(`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`)을 쓴다.
3. **한 종류의 부품을 바꾸는 일은 테마에서 한다.** (예: 모든 버튼 높이, 눌린 토글 색) 화면마다 덮어쓰지 않는다. `npx astryx experimental theme editor how "<원하는 것>"`이 명령을 알려 준다. 바꾼 뒤 `editor show yaksok --png`로 그림을 보고 확인한다.
4. **Astryx에 없는 것만 직접 그린다.** 복용률 고리, 섭취량 막대, 스캔 화면의 상자·단계 표시, 카메라 뷰파인더, 아래 탭바. 이것도 색은 Astryx 토큰으로.
5. 휴대폰 모양은 접는 폰 바깥 화면(280px)부터 태블릿·가로까지 다양하다. 아래 "화면 틀" 토큰과 `@container`로 짜고, 바꿀 때마다 "크기 검사"를 돌린다.
6. 납품 전에 `npx astryx doctor --built .`이 실패(fail) 없이 끝나야 한다.

## 방향 A: 따뜻한 루틴 + AI 신호

시안과 이유: 작업 폴더 `design/direction/README.md` (2026-11-28에 A로 정함).

1. **화면마다 주인공 하나.** 홈은 "지금 먹을 차례"와 먹었어요, 리포트는 결론 한 문장, 알림은 "몇 분 뒤", 스캔은 AI가 찾은 병, 내 영양제는 약장 카드.
2. **안전은 신호등.** 초록(success) = 안전, 호박(warning) = 상한 넘음, 빨강(error) = 위험. 다른 뜻으로 쓰지 않는다. 문장으로 먼저 말한다.
3. **AI가 한 일은 보라.** Astryx의 info 색을 보라(`#6A4CF5`)로 바꿨다. `Banner status="info"`, `--color-info*`, 스캔 화면 `--scan-accent`는 "AI가 알려 준 것"에만 쓴다.
4. **숫자는 크게, 버튼은 엄지 쪽.** 떠 있는 탭바, 가운데 찍기, 확인은 아래 시트.
5. 먹색 카드(`--surface-ink`)는 "다음 알림"처럼 강조할 카드 하나에만.

## 약속 테마 (`yaksok`, neutral 기반)

| 설정 | 값 | 이유 |
|---|---|---|
| 바탕 / 카드 / 선 (밝은) | `#FBF6F0` / `#FFFFFF` / `#EFE5DA` | 따뜻한 크림 |
| 회색 계열(neutral) | `#8A7B6E` | 따뜻한 회색 |
| 기준색(accent) | `#D83A08` | 흰 글자 대비 4.5:1 이상 |
| 안전 / 주의 / 위험 | `#24946A` / `#C77700` / `#D92D20` | 글자로 쓸 때는 테마가 대비를 맞춘 진한 단계를 쓴다 |
| AI (info) | `#6A4CF5` | |
| 모서리 | 카드 24px, 버튼·입력 16px | |
| 그림자 | raised | |
| 글꼴 | Pretendard Variable (한글 포함, `pretendard` 패키지) | |
| 버튼·입력칸·세그먼트·목록 줄 | 최소 44px | |
| 눌린 토글 | 기준색 바탕 | |

바꾸는 법: `npx astryx experimental theme editor set yaksok <무엇> <값>` → `editor show yaksok --png`로 그림 확인 → **`npm run astryx:fonts`** (편집기가 글꼴 파일을 다시 쓰면 한글 Pretendard 줄이 빠진다. 편집기는 Fontsource판만 알아보는데 Fontsource판에는 한글이 없다).

## 예전 이름 (호환)

Astryx 전에 쓰던 이름(`--primary-color`, `--surface-1`, `--text-muted`, `--color-danger-fg` 등)은 `tokens.css` 아래쪽에서 Astryx 토큰을 가리킨다. 아직 Astryx 부품으로 다 옮기지 않은 카메라·스캔 화면이 같은 팔레트와 어두운 모드를 따르게 하려는 것이다. **새 코드에서는 쓰지 않는다.**

전역 초기화(`* { margin: 0 }` 등)는 `@layer reset`에 넣는다. 층 밖에 두면 Astryx 부품의 여백까지 지운다.

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

## 화면 상태

| 화면 | 상태 |
|---|---|
| 홈 | 방향 A: 지금 먹을 차례 카드(`NowCard`) + 오늘 일정 |
| 알림 | 방향 A: 먹색 "다음 알림" 카드 + 하루 줄기 + 상태 칩 |
| 내 영양제 | 방향 A: 약장 카드 2열, 직접 추가 카드 |
| 리포트 | 방향 A: 결론 카드(신호등) + 상한 세로선 막대 |
| 스캔 분석 | 방향 A: 어두운 렌즈, AI 보라 상자·단계, 결과는 밝은 시트와 일치율 |
| 나(설정)·내 정보 수정·계정 보안·탈퇴, 로그인·가입·비밀번호 찾기, 복용 알림 창 | Astryx 부품 + 테마 (구성은 그대로) |
| 카메라 촬영, 탭바 | 직접 그림 (탭바는 방향 A의 떠 있는 막대) |
| 아직 없음 | 연속 기록(날짜별 복용 기록이 필요), 홈 안전 신호(안전한 섭취량 API가 필요) |
