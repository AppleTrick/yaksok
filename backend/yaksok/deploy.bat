@echo off
echo 🚀 Docker Redeploy (yaksok project only)

REM =========================
REM 1. 이 프로젝트 컨테이너/이미지/볼륨만 정리
REM =========================
docker compose down --rmi all -v

REM =========================
REM 2. Spring Boot 빌드
REM =========================
call gradlew.bat clean build -x test
if errorlevel 1 (
  echo ❌ Gradle build failed
  pause
  exit /b 1
)

REM =========================
REM 3. Docker 재빌드 & 실행
REM =========================
docker compose up --build -d

REM =========================
REM 4. 상태 확인
REM =========================
docker ps

echo ✅ Deploy finished (project scoped)
pause
