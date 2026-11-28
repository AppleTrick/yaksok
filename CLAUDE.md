# 약속 작업 규칙

## 프론트엔드 화면 작업

**화면(`frontend/`)을 만들거나 고칠 때는 반드시 `frontend/DESIGN.md`와 `frontend/AGENTS.md`(Astryx 안내)를 먼저 읽고 따른다.**

- 부품은 Astryx(`@astryxdesign/core`)를 쓴다. 사용법은 `npx astryx component <이름>`으로 확인한다.
- 색, 글자 크기, 굵기, 모서리는 약속 테마(`frontend/themes/yaksok`)가 정한다. `#hex`, `rgba()`, 숫자 크기를 새로 직접 쓰지 않는다. 한 종류의 부품을 바꾸는 일은 테마 편집기로 한다.
- `100vh`, `480px` 같은 틀 값 대신 `DESIGN.md`의 "화면 틀" 토큰을 쓴다.
- 화면을 바꾸면 "크기 검사"(`tools/visual/responsive.cjs`)와 "화면 비교"를 돌리고, `npx astryx doctor --built .`이 실패 없이 끝나야 한다.
- 옮기기(화면 그대로)와 값 바꾸기(화면이 달라짐)를 한 커밋에 섞지 않는다.

## PR

- `.github/pull_request_template.md` 양식을 따른다.
- `master`에 머지하면 Jenkins가 바로 운영에 배포한다. "배포 전 확인"을 비워 두지 않는다.
