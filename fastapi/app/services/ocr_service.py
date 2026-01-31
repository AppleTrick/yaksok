"""
OCR 텍스트 추출 서비스 (PP-OCRv5 Upgraded Version)

[업그레이드 내용]
1. PP-OCRv3 → PP-OCRv5 업그레이드
2. korean_PP-OCRv5_mobile_rec 한국어 전용 모델 사용 (88% 정확도)
3. predict() API 사용 (문서 방향 감지 및 텍스트 라인 방향 자동 처리)
4. 수동 회전 탐색 로직 제거 (PP-OCRv5 내부 자동 처리)
"""

import os
import re
import numpy as np
import cv2
from paddleocr import PaddleOCR

# ============================================================
# OCR 모델 초기화 (PP-OCRv5 Korean Model)
# ============================================================

print("[OCR 서비스] PP-OCRv5 korean_PP-OCRv5_mobile_rec 모델 로딩 중...")
try:
    ocr_model = PaddleOCR(
        # PP-OCRv5 한국어 전용 모델
        text_recognition_model_name="korean_PP-OCRv5_mobile_rec",
        
        # 문서 전처리 옵션
        use_doc_orientation_classify=False,  # 문서 회전 감지 (필요시 True)
        use_doc_unwarping=True,          # 곡면 보정 (필요시 True, 성능 영향)
        use_textline_orientation=True,       # 텍스트 라인 방향 감지


        det_db_unclip_ratio=2.0,  # 박스를 좀 더 넉넉하게 따서 휘어진 부분까지 포함
        det_db_thresh=0.3,        # 탐지 민감도 조절
        rec_batch_num=6,          # 인식 속도와 정확도 밸런스
    )
    print("[OCR 서비스] ✅ PP-OCRv5 모델 로드 완료")
except Exception as e:
    print(f"[OCR 서비스] ❌ PP-OCRv5 모델 로드 실패: {e}")
    ocr_model = None

# ============================================================
# SaveImage 폴더 설정
# ============================================================
APP_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVE_IMAGE_DIR = os.path.join(APP_DIR, "SaveImage")
os.makedirs(SAVE_IMAGE_DIR, exist_ok=True)


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """
    이미지 크기에 따른 자동 보정 (돋보기 & 망원경)
    """
    if image is None:
        return None
    h, w = image.shape[:2]
    
    # 1. 이미지가 너무 작을 때 (Upscaling) - 작은 글씨 뭉개짐 방지
    if h < 600 or w < 600:
        scale = 2.0
        if h < 300 or w < 300:
            scale = 3.0
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_CUBIC)

    # 2. 이미지가 너무 클 때 (Downscaling) - 메모리 최적화
    elif h > 1500 or w > 1500:
        max_dim = 1500
        scale = max_dim / max(h, w)
        new_w = int(w * scale)
        new_h = int(h * scale)
        image = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
    return image


def parse_ppocrv5_result(result):
    """
    PP-OCRv5 predict() 결과 파싱
    
    PP-OCRv5는 result 객체를 반환하며, 다음 속성을 포함:
    - rec_texts: 인식된 텍스트 리스트
    - rec_scores: 신뢰도 리스트
    - dt_polys 또는 rec_polys: 좌표 리스트
    """
    parsed_items = []
    
    if not result:
        return parsed_items
    
    for res in result:
        try:
            # res 객체에서 데이터 추출
            if hasattr(res, 'rec_texts'):
                rec_texts = res.rec_texts
                rec_scores = res.rec_scores if hasattr(res, 'rec_scores') else [0.99] * len(rec_texts)
                rec_polys = res.dt_polys if hasattr(res, 'dt_polys') else []
            elif isinstance(res, dict):
                rec_texts = res.get('rec_texts', [])
                rec_scores = res.get('rec_scores', [0.99] * len(rec_texts))
                rec_polys = res.get('dt_polys', res.get('rec_polys', []))
            else:
                continue
            
            for i, text in enumerate(rec_texts):
                if not text or not str(text).strip():
                    continue
                    
                score = float(rec_scores[i]) if i < len(rec_scores) else 0.99
                coords = rec_polys[i].tolist() if i < len(rec_polys) and hasattr(rec_polys[i], 'tolist') else []
                
                # 40% 이상 신뢰도만 포함 (유색 로고 대응)
                if score >= 0.4:
                    parsed_items.append({
                        "text": str(text).strip(),
                        "confidence": score,
                        "coords": coords
                    })
                    
        except Exception as e:
            print(f"[OCR] 결과 파싱 중 오류: {e}")
            continue
    
    return parsed_items


def clean_text_hybrid(text: str, mode: str = "product") -> str:
    """
    하이브리드 텍스트 정규화
    - mode="product": 제품명 매칭용 (특수문자 제거 + 한글 자간 결합)
    - mode="general": 일반 정보용 (특수문자 보존)
    """
    if not text:
        return ""

    # 1. 공통 노이즈 제거 (의미 없는 잡기호)
    text = re.sub(r'[^a-zA-Z0-9가-힣\s\.,:%();/~+\-\[\]]', ' ', text)

    if mode == "product":
        # 제품명 매칭용: 특수문자 싹 날리고 검색 키워드 위주 정제
        text = re.sub(r'[\.,:%();/~+\-\[\]]', ' ', text)
        # 단어 사이의 미세 공백 제거 (비 타 민 -> 비타민)
        # 한 글자씩 떨어져 있는 한글들을 강제로 붙임
        text = re.sub(r'([가-힣])\s+(?=[가-힣]\s|[가-힣]$)', r'\1', text)
    
    # 2. 연속 공백 정리
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def group_text_to_lines(items: list, threshold_ratio: float = 0.5) -> dict:
    """
    OCR 파편들을 줄(Line) 단위로 그룹화하고 정렬합니다.
    """
    if not items:
        return {"text": "", "lines": []}

    # 1. 각 항목의 중심점과 높이 계산
    for item in items:
        coords = np.array(item["coords"])
        y_min = np.min(coords[:, 1])
        y_max = np.max(coords[:, 1])
        x_min = np.min(coords[:, 0])
        x_max = np.max(coords[:, 0])
        
        item["center_y"] = (y_min + y_max) / 2
        item["center_x"] = (x_min + x_max) / 2
        item["height"] = y_max - y_min

    # 2. 중심 Y 좌표 기준으로 정렬
    sorted_items = sorted(items, key=lambda x: x["center_y"])

    lines = []
    if sorted_items:
        current_line = [sorted_items[0]]
        
        for i in range(1, len(sorted_items)):
            item = sorted_items[i]
            prev_item = current_line[-1]
            
            # 수직 거리 계산
            dist = abs(item["center_y"] - prev_item["center_y"])
            # 현재 줄의 평균 높이와 비교하여 임계값 이내면 같은 줄로 판정
            avg_height = sum(it["height"] for it in current_line) / len(current_line)
            
            if dist < avg_height * threshold_ratio:
                current_line.append(item)
            else:
                # 줄 내부에서 X 좌표 기준 정렬 (왼쪽 -> 오른쪽)
                current_line.sort(key=lambda x: x["center_x"])
                lines.append(current_line)
                current_line = [item]
        
        # 마지막 줄 처리
        current_line.sort(key=lambda x: x["center_x"])
        lines.append(current_line)

    # 3. 텍스트 병합 및 로그용 데이터 생성 (평균 신뢰도 70% 이상만 필터링 + Denoising)
    lines_with_meta = []
    filtered_lines = []
    
    for line in lines:
        # 각 아이템 텍스트 정제 (제품 기본 정제 모드 사용)
        raw_line_text = " ".join([it["text"] for it in line])
        cleaned_line_text = clean_text_hybrid(raw_line_text, mode="product")
        
        # 정제 후 너무 짧거나 의미 없는 텍스트(노이즈)면 제외
        if len(cleaned_line_text) < 1:
            continue
            
        line_conf = sum([it["confidence"] for it in line]) / len(line)
        
        # 줄 단위 50% 임계값 적용 (로고 인식률 향상)
        if line_conf >= 0.5:
            lines_with_meta.append({
                "text": cleaned_line_text,
                "confidence": line_conf
            })
            filtered_lines.append(line)

    full_text = "\n".join([lm["text"] for lm in lines_with_meta])
    
    return {
        "text": full_text.strip(),
        "lines": filtered_lines,
        "lines_with_meta": lines_with_meta
    }


def extract_text(image: np.ndarray, rotations: list = None, save_image: bool = False) -> dict:
    """
    이미지에서 텍스트를 추출합니다. (PP-OCRv5)
    
    PP-OCRv5는 내부적으로 텍스트 라인 방향 감지를 수행하므로
    수동 회전 탐색이 불필요합니다.
    
    Args:
        image: OpenCV 이미지 (BGR 또는 RGB)
        rotations: (무시됨) PP-OCRv5는 자동 방향 감지
        save_image: 디버깅용 이미지 저장 여부
        
    Returns:
        dict: {
            "text": str,           # 추출된 전체 텍스트
            "items": list,         # 개별 텍스트 항목들
            "confidence": float    # 평균 신뢰도
        }
    """
    # 방어 로직: 모델 없거나 이미지 없으면 조기 리턴
    if ocr_model is None:
        return {
            "text": "", "items": [], "texts": [], 
            "count": 0, "confidence": 0.0, 
            "error": "OCR 모델 로드 실패"
        }
    
    if image is None or not isinstance(image, np.ndarray) or image.size == 0:
        return {
            "text": "", "items": [], "texts": [], 
            "count": 0, "confidence": 0.0, 
            "error": "유효하지 않은 이미지"
        }
    
    # 이미지 전처리
    processed = preprocess_image(image)
    if processed is None:
        return {
            "text": "", "items": [], "texts": [], 
            "count": 0, "confidence": 0.0, 
            "error": "이미지 전처리 실패"
        }
    
    # 디버깅용 이미지 저장
    if save_image:
        try:
            import time
            timestamp = int(time.time() * 1000)
            save_path = os.path.join(SAVE_IMAGE_DIR, f"ocr_input_{timestamp}.jpg")
            cv2.imwrite(save_path, processed)
            print(f"[OCR] 이미지 저장됨: {save_path}")
        except Exception as e:
            print(f"[OCR] 이미지 저장 실패: {e}")
    
    try:
        # PP-OCRv5 predict API 호출
        result = ocr_model.predict(processed)
        items = parse_ppocrv5_result(result)
        
        if items:
            total_conf = sum(item["confidence"] for item in items)
            avg_conf = total_conf / len(items)
            
            # Line Grouping 적용
            grouped_result = group_text_to_lines(items)
            full_text = grouped_result["text"]
            lines_meta = grouped_result["lines_with_meta"]
            
            # 터미널에 OCR 결과 출력
            filtered_count = sum(len(line) for line in grouped_result["lines"])
            print(f"[OCR] ✅ {filtered_count}개 텍스트 추출 (50% 미만 제외, 전체 평균 신뢰도: {avg_conf:.1%})")
            print("[OCR] --- 추출된 텍스트 및 줄별 정확도 ---")
            for i, lm in enumerate(lines_meta):
                print(f"  [{i+1:02d}] ({lm['confidence']:.0%}) {lm['text']}")
            if not lines_meta:
                print("  (50% 이상의 신뢰도를 가진 텍스트가 없습니다)")
            print("[OCR] --------------------------------------")
            
            return {
                "text": full_text,
                "items": items,
                "texts": items,  # analysis_service.py 호환용
                "count": len(items),  # /test 페이지 호환용
                "confidence": avg_conf,
                "lines": lines_meta  # 상세 라인 정보
            }
        else:
            print("[OCR] ⚠️ 텍스트 추출 결과 없음")
            return {
                "text": "", "items": [], "texts": [], 
                "count": 0, "confidence": 0.0
            }
            
    except Exception as e:
        print(f"[OCR] PP-OCRv5 처리 중 오류: {e}")
        return {
            "text": "", "items": [], "texts": [], 
            "count": 0, "confidence": 0.0, 
            "error": str(e)
        }