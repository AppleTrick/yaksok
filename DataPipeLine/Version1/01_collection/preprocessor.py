import cv2
import os
import numpy as np

class ImagePreprocessor:
    def __init__(self, target_size=(1280, 1280)):
        """
        초기화 함수
        :param target_size: 모델 학습에 사용할 최종 이미지 크기
        """
        self.target_size = target_size

    def resize_with_padding(self, image):
        """
        원본 비율을 유지하며 리사이징하고, 빈 공간을 검은색 패딩으로 채움 (Letterboxing)
        """
        h, w = image.shape[:2]
        target_w, target_h = self.target_size
        
        # 원본 비율을 유지하기 위한 스케일 비율 계산
        scale = min(target_w / w, target_h / h)
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # 보간법(LANCZOS4)을 사용하여 이미지 리사이징
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)
        
        # 최종 크기의 검은색 배경(캔버스) 생성
        canvas = np.full((target_h, target_w, 3), 0, dtype=np.uint8)
        
        # 이미지를 캔버스의 중앙에 배치하기 위한 오프셋 계산
        x_offset = (target_w - new_w) // 2
        y_offset = (target_h - new_h) // 2
        
        # 캔버스에 리사이징된 이미지 복사
        canvas[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized
        return canvas

    def enhance_image(self, image):
        """
        기초적인 이미지 강화: 노이즈 제거 및 대비 개선
        """
        # 1. 노이즈 제거 (비로컬 평균 필터링)
        denoised = cv2.fastNlMeansDenoisingColored(image, None, 10, 10, 7, 21)
        
        # 2. 이미지 대비(Contrast) 개선 (CLAHE 기법 사용)
        # 이미지를 LAB 색공간으로 변환하여 밝기(L) 채널만 보정
        lab = cv2.cvtColor(denoised, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # 적응형 히스토그램 평활화(CLAHE) 객체 생성
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        
        # 보정된 L 채널을 다시 합치고 BGR로 변환
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
        return enhanced

    def process_folder(self, input_folder, output_folder):
        """
        특정 폴더 내의 모든 이미지를 일괄 처리하여 저장
        """
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
            
        processed_count = 0
        # 지원하는 이미지 확장자 필터링
        files = [f for f in os.listdir(input_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        for filename in files:
            img_path = os.path.join(input_folder, filename)
            img = cv2.imread(img_path)
            
            if img is None:
                continue
            
            # 1. 비율 유지 리사이징 및 패딩 적용
            resized = self.resize_with_padding(img)
            
            # 2. 노이즈 제거 및 고대비 강화
            enhanced = self.enhance_image(resized)
            
            # 최종 결과물 저장
            output_path = os.path.join(output_folder, filename)
            cv2.imwrite(output_path, enhanced)
            processed_count += 1
            
        return processed_count

if __name__ == "__main__":
    # 개별 테스트용 루틴
    print("전처리 모듈 단독 실행 중...")
    # preprocessor = ImagePreprocessor()
    # preprocessor.process_folder('data/raw/bottle', 'data/processed/bottle')
