#!/bin/bash

set -e  # 에러 발생 시 즉시 중단

PROJECT_NAME=yaksok

echo "===================================="
echo "🚀 [$PROJECT_NAME] Docker Redeploy"
echo "===================================="

# 1. 실행 중인 컨테이너 중지
echo "🛑 Stopping containers..."
docker compose down

# 2. 안 쓰는 컨테이너/네트워크 정리
echo "🧹 Removing dangling resources..."
docker container prune -f
docker network prune -f

# 3. (선택) 이미지 제거
echo "🗑 Removing old images..."
docker image prune -f

# 4. Spring Boot 빌드
echo "🏗 Building Spring Boot..."
./gradlew clean build -x test

# 5. Docker 이미지 빌드 + 실행
echo "🐳 Starting containers..."
docker compose up --build -d

# 6. 상태 확인
echo "📦 Running containers:"
docker ps

echo "✅ Deploy finished successfully!"
