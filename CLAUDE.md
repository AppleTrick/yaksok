# 약속 작업 규칙

## 프론트엔드 화면 작업

**화면(`frontend/`)을 만들거나 고칠 때는 반드시 `frontend/DESIGN.md`를 먼저 읽고 따른다.**

- 색, 글자 크기, 굵기, 모서리, 쌓임 순서는 `frontend/src/styles/tokens.css`의 토큰으로만 쓴다. `#hex`, `rgba()`, 숫자 크기를 새로 직접 쓰지 않는다.
- 필요한 값이 없으면 `tokens.css`에 먼저 추가하고 `DESIGN.md` 표를 고친다.
- 공용 부품(`frontend/src/components`)이 있으면 그것을 쓴다.
- 화면을 바꾸면 `DESIGN.md`의 "화면 비교"를 돌린다. 의도하지 않은 차이가 있으면 커밋하지 않는다.
- `100vh`, `480px` 같은 틀 값 대신 `DESIGN.md`의 "화면 틀" 토큰을 쓰고, 화면을 바꾸면 "크기 검사"(`tools/visual/responsive.cjs`)도 돌린다.
- 옮기기(화면 그대로)와 값 바꾸기(화면이 달라짐)를 한 커밋에 섞지 않는다.

## PR

- `.github/pull_request_template.md` 양식을 따른다.
- `master`에 머지하면 Jenkins가 바로 운영에 배포한다. "배포 전 확인"을 비워 두지 않는다.
