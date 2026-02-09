실행방법

1. Frontend (Next.js)

```bash
cd frontend

npm install (패키지 설치)

npm run dev
```

2. Backend (Spring Boot)

```bash
./gradlew bootRun
```

3. AI Server (FastAPI)

```bash
cd fastapi

pip install -r requirements.txt (패키지 설치)

venv\Scripts\activate (가상환경 실행)

uvicorn main:app --reload
```

환경변수 각 폴다마다 .env 파일 생성하고 넣어주기