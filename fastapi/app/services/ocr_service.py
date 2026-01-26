"""
OCR 텍스트 추출 서비스

이미지에서 텍스트를 추출하는 OCR 서비스입니다.
PaddlePaddle과 PyTorch(YOLO) 간의 DLL 충돌을 피하기 위해
별도 프로세스(ocr_worker.py)로 실행됩니다.
"""

import os
import json
import subprocess
import tempfile
import numpy as np
import cv2


# ============================================================
# 경로 설정
# ============================================================

# services 폴더 경로 (현재 파일과 같은 폴더)
SERVICES_DIR = os.path.dirname(os.path.abspath(__file__))
OCR_WORKER_PATH = os.path.join(SERVICES_DIR, "ocr_worker.py")

# fastapi 폴더 경로 (venv가 있는 곳)
FASTAPI_DIR = os.path.dirname(os.path.dirname(SERVICES_DIR))
PYTHON_PATH = os.path.join(FASTAPI_DIR, "venv", "Scripts", "python.exe")

print(f"[OCR 서비스] Services 디렉토리: {SERVICES_DIR}")
print(f"[OCR 서비스] OCR Worker 경로: {OCR_WORKER_PATH}")
print(f"[OCR 서비스] Python 경로: {PYTHON_PATH}")
print(f"[OCR 서비스] OCR Worker 존재: {os.path.exists(OCR_WORKER_PATH)}")
print(f"[OCR 서비스] Python 존재: {os.path.exists(PYTHON_PATH)}")


# ============================================================
# OCR 실행 함수
# ============================================================

def extract_text(cv2_image: np.ndarray, timeout: int = 60) -> dict:
    """
    이미지에서 텍스트를 추출합니다.
    subprocess로 ocr_worker.py를 호출하여 DLL 충돌을 방지합니다.
    
    Args:
        cv2_image: OpenCV 형식 이미지 (BGR)
        timeout: 타임아웃 초 (기본 60초)
        
    Returns:
        OCR 결과 {texts, count} 또는 {texts, error}
    """
    print(f"\n[OCR] === 텍스트 추출 시작 (subprocess) ===")
    
    # 경로 존재 확인
    if not os.path.exists(OCR_WORKER_PATH):
        error_msg = f"OCR Worker 파일이 없습니다: {OCR_WORKER_PATH}"
        print(f"[OCR] ❌ {error_msg}")
        return {"texts": [], "error": error_msg}
    
    if not os.path.exists(PYTHON_PATH):
        error_msg = f"Python 실행 파일이 없습니다: {PYTHON_PATH}"
        print(f"[OCR] ❌ {error_msg}")
        return {"texts": [], "error": error_msg}
    
    try:
        # 임시 파일로 이미지 저장
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp_file:
            tmp_path = tmp_file.name
            cv2.imwrite(tmp_path, cv2_image)
            print(f"[OCR] 임시 파일 저장: {tmp_path}")
        
        # subprocess로 OCR 실행
        result = subprocess.run(
            [PYTHON_PATH, OCR_WORKER_PATH, tmp_path],
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding='utf-8'
        )
        
        # 임시 파일 삭제
        try:
            os.unlink(tmp_path)
        except:
            pass
        
        if result.returncode != 0:
            print(f"[OCR] ❌ 프로세스 오류: {result.stderr}")
            return {"texts": [], "error": result.stderr}
        
        # JSON 결과 파싱
        try:
            ocr_result = json.loads(result.stdout)
        except json.JSONDecodeError as e:
            print(f"[OCR] ❌ JSON 파싱 오류: {e}")
            print(f"[OCR] stdout: {result.stdout[:500]}")
            return {"texts": [], "error": f"JSON 파싱 오류: {e}"}
        
        if ocr_result.get("success"):
            texts = ocr_result.get("texts", [])
            for item in texts:
                print(f"[OCR] 📝 '{item['text']}' (신뢰도: {item['confidence']:.0%})")
            
            print(f"[OCR] 추출된 텍스트 수: {len(texts)}")
            print(f"[OCR] === 텍스트 추출 완료 ===\n")
            
            return {
                "texts": texts,
                "count": len(texts)
            }
        else:
            error = ocr_result.get("error", "알 수 없는 오류")
            print(f"[OCR] ❌ OCR 실패: {error}")
            return {"texts": [], "error": error}
        
    except subprocess.TimeoutExpired:
        print(f"[OCR] ❌ 타임아웃 ({timeout}초 초과)")
        return {"texts": [], "error": f"OCR 타임아웃 ({timeout}초)"}
    except Exception as e:
        print(f"[OCR] ❌ 오류 발생: {e}")
        return {"texts": [], "error": str(e)}
