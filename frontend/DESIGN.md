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
| 글꼴 | Pretendard (`@fontsource/pretendard`, OFL) |

## 원칙

1. **Astryx 부품부터 쓴다.** 글자는 `Text`·`Heading`, 배치는 `VStack`·`HStack`, 묶음은 `Card`, 목록은 `List`·`ListItem`, 입력은 `TextInput`·`TimeInput`·`Selector`·`SegmentedControl`·`ToggleButtonGroup`·`Switch`, 창은 `Dialog`·`AlertDialog`·`BottomSheet`, 안내는 `Banner`·`EmptyState`. 부품 사용법은 `npx astryx component <이름>`으로 확인한다.
2. **색·크기·모서리는 테마가 정한다.** 화면에서 `#hex`, `rgba()`, 숫자 크기를 쓰지 않는다. 꼭 필요하면 Astryx 토큰(`var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`)을 쓴다.
3. **한 종류의 부품을 바꾸는 일은 테마에서 한다.** (예: 모든 버튼 높이, 눌린 토글 색) 화면마다 덮어쓰지 않는다. `npx astryx experimental theme editor how "<원하는 것>"`이 명령을 알려 준다. 바꾼 뒤 `editor show yaksok --png`로 그림을 보고 확인한다.
4. **Astryx에 없는 것만 직접 그린다.** 복용률 고리, 섭취량 막대, 스캔 화면의 상자·단계 표시, 카메라 뷰파인더, 아래 탭바. 이것도 색은 Astryx 토큰으로.
5. 휴대폰 모양은 접는 폰 바깥 화면(280px)부터 태블릿·가로까지 다양하다. 아래 "화면 틀" 토큰과 `@container`로 짜고, 바꿀 때마다 "크기 검사"를 돌린다.
6. 납품 전에 `npx astryx doctor --built .`이 실패(fail) 없이 끝나야 한다.

## 약속 테마 (`yaksok`, neutral 기반)

| 설정 | 값 | 이유 |
|---|---|---|
| 기준색(accent) | `#D83A08` | 흰 글자 대비 4.5:1 이상. 링크·강조 글자는 테마가 더 진한 단계로 바꾼다 |
| 기준색 위 글자 | 흰색 | |
| 모서리 | large | |
| 글꼴 | Pretendard (본문·제목) | 한글 |
| 버튼·입력칸·세그먼트·목록 줄 | 최소 높이 44px | 손가락으로 누르는 앱 |
| 눌린 토글(요일, 질환) | 기준색 바탕 | 회색이면 안 눌린 것과 구별이 안 됐다 |

바꾸는 법: `npx astryx experimental theme editor set yaksok <무엇> <값>` → `npx astryx experimental theme editor show yaksok --png`로 확인 → 앱은 자동으로 따라온다.

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
| 홈, 내 영양제(목록·상세·직접 등록), 알림(목록·수정 시트·방해금지), 설정·마이페이지·내 정보 수정·계정 보안·탈퇴, 로그인·가입·비밀번호 찾기, 리포트, 복용 알림 창 | Astryx 부품 |
| 스캔 분석 화면 | 어두운 테마를 겹쳐 씌우고 버튼·요약·안내만 Astryx. 상자·단계 시각화는 직접 그림 |
| 카메라 촬영, 아래 탭바, 푸시 권한 안내 | 직접 그림 (색은 토큰) |
