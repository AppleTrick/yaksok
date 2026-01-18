# 모바일 카메라 접근 이슈 (2026-01-18)

## 문제 상황
- **증상**: 프론트엔드 로컬(`localhost`)에서는 카메라가 정상 동작하나, 동일 네트워크의 모바일 기기(iPhone Safari 등)에서 프론트 서버 접속 시 카메라 접근이 차단됨.
- **원인**: 브라우저 보안 정책상 `localhost`가 아닌 `http://` 프로토콜에서는 `navigator.mediaDevices.getUserMedia`(카메라 접근) API가 차단됨. 모바일에서 테스트하려면 **HTTPS** 환경이 필수적임.

## 시도한 해결책 및 결과

### 1. ngrok 사용 (`npx ngrok http 3000`)
- **결과**: **실패 (Authentication Failed)**
- **에러 로그**:
  ```
  ERROR:  authentication failed: Usage of ngrok requires a verified account and authtoken.
  ERROR:  ERR_NGROK_4018
  ```
- **원인**: ngrok 최신 버전부터는 무료 사용이라도 계정 로그인 및 Authtoken 등록이 필수가 됨.

### 2. localtunnel 사용 (`npx localtunnel --port 3000`)
- **결과**: **실패 / 불안정**
- **내용**: `https://*.loca.lt` 주소가 생성되긴 했으나, 접속 시 비밀번호(공인 IP) 입력 등 절차가 복잡하고 연결이 원활하지 않음.

## 향후 계획 (TODO)
- **목표**: 추후 배포 단계에서 SSL 인증서가 적용된 도메인(`https://...`)을 연결하여 모바일에서도 카메라가 정상 작동하도록 구현해야 함.
- **현재 상황**: 일단 모바일 테스트는 보류하고, 로컬 환경에서 기능 개발(FastAPI 연동 등)을 우선 진행함. (테스트용 파일 업로드 기능으로 대체 가능)
