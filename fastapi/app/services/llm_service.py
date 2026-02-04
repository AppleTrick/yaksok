import os
import httpx
from dotenv import load_dotenv

# .env 파일 절대 경로 로드
SERVICE_DIR = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.dirname(SERVICE_DIR)
FASTAPI_ROOT = os.path.dirname(APP_DIR)
ENV_PATH = os.path.join(FASTAPI_ROOT, ".env")

if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

# GMS API 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# 직접 모델명 변경할 수 있도록 변수화
# 사용 가능한 모델: gemini-2.0-flash-lite, gemini-1.5-flash 등
GEMINI_MODEL_NAME = "gemini-2.0-flash-lite"

# 제공해주신 SSAFY GMS 엔드포인트 구조 (모델명을 변수로 삽입)
GMS_ENDPOINT_TEMPLATE = "https://gms.ssafy.io/gmsapi/generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
GMS_ENDPOINT = GMS_ENDPOINT_TEMPLATE.format(model_name=GEMINI_MODEL_NAME)

async def extract_product_name_with_llm(ocr_text: str) -> str:
    """
    SSAFY GMS Gemini API를 사용하여 OCR 텍스트에서 정확한 제품명을 추출합니다.
    """
    if not GEMINI_API_KEY or not ocr_text.strip():
        return ""

    prompt = f"""
    너는 영양제 라벨 OCR 분석 전문가야. 주어진 OCR 텍스트에서 모든 정보를 종합하여 정확한 '제품명'을 추출해줘.

    [추출 가이드라인]
    1. **형식**: 반드시 '브랜드명 + 상품명'의 조합으로 출력해 (예: 정관장 홍삼정, 고려은단 비타민C).
    2. **오타 교정**: OCR 특성상 발생하는 오타(예: '비타민C' -> '비타만C', '골드' -> '골드')를 네 지식을 활용해 올바른 표준 제품명으로 교정해.
    3. **제외 항목**: '60정', '1000mg', '일반의약품', '건강기능식품' 등의 규격, 용량, 분류 정보는 제품명에서 제외해.
    4. **명확성**: 불필요한 설명 없이 오직 추출된 제품명만 한 줄로 답변해.

    [OCR TEXT]
    {ocr_text}

    제품명:
    """

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY
    }

    try:
        print(f"\n[GMS Service] === 정제 작업 시작 ===")
        print(f"[GMS Service] 입력 OCR 텍스트: {ocr_text[:100]}...") # 너무 길면 잘라서 출력
        print(f"[GMS Service] GMS API 호출 중... (모델: {GEMINI_MODEL_NAME})")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                GMS_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=15.0
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"[GMS Service] ✅ 응답 수신 성공 (Status: 200)")
                # Gemini API 응답 구조에서 텍스트 추출
                try:
                    product_name = result['candidates'][0]['content']['parts'][0]['text'].strip()
                    # 가끔 LLM이 따옴표를 포함하는 경우가 있어 제거
                    product_name = product_name.replace('"', '').replace("'", "")
                    print(f"[GMS Service] 추출된 제품명: {product_name}")
                    print(f"[GMS Service] === 정제 작업 완료 ===\n")
                    return product_name
                except (KeyError, IndexError) as e:
                    print(f"[GMS Service Parse Error] 응답 구조가 예상과 다릅니다: {e}")
                    return ""
            else:
                print(f"[GMS Service API Error] ❌ 요청 실패 (Status: {response.status_code})")
                print(f"[GMS Service API Error] Body: {response.text}")
                return ""
                
    except Exception as e:
        print(f"[GMS Service Connection Error] ❌ 연결 오류: {e}")
        return ""
