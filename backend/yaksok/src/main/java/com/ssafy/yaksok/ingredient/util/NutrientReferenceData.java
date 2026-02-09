package com.ssafy.yaksok.ingredient.util;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * 한국 식약처 기준 영양소 권장섭취량 및 상한섭취량 데이터
 * 
 * 2020 한국인 영양소 섭취기준(KDRIs) 기반
 * 성인(19-64세) 기준으로 작성
 * 
 * - recommendedIntake: 권장섭취량 (일일 최소 권장량)
 * - upperLimit: 상한섭취량 (일일 최대 안전 섭취량)
 */
@Component
public class NutrientReferenceData {

    private static final Map<String, NutrientInfo> NUTRIENT_DATA = new HashMap<>();

    static {
        // ===== 비타민 B군 =====
        addNutrient("비타민 B1", 1.2, null, "mg"); // 상한 없음
        addNutrient("비타민 B2", 1.4, null, "mg"); // 상한 없음
        addNutrient("비타민 B3", 15.0, 35.0, "mg"); // 나이아신
        addNutrient("비타민 B5", 5.0, null, "mg"); // 판토텐산, 상한 없음
        addNutrient("비타민 B6", 1.5, 100.0, "mg");
        addNutrient("비타민 B7", 30.0, null, "μg"); // 비오틴, 상한 없음
        addNutrient("비타민 B9", 400.0, 1000.0, "μg"); // 엽산
        addNutrient("비타민 B12", 2.4, null, "μg"); // 상한 없음

        // ===== 기타 비타민 =====
        addNutrient("비타민 A", 700.0, 3000.0, "μg"); // RAE 기준
        addNutrient("비타민 C", 100.0, 2000.0, "mg");
        addNutrient("비타민 D", 10.0, 100.0, "μg"); // 400 IU = 10μg
        addNutrient("비타민 E", 12.0, 540.0, "mg"); // α-토코페롤 기준
        addNutrient("비타민 K", 75.0, null, "μg"); // 상한 없음

        // ===== 미네랄 =====
        addNutrient("칼슘", 700.0, 2500.0, "mg");
        addNutrient("마그네슘", 350.0, 350.0, "mg"); // 보충제 기준 상한
        addNutrient("아연", 8.5, 35.0, "mg");
        addNutrient("철분", 10.0, 45.0, "mg"); // 남성 기준
        addNutrient("셀레늄", 60.0, 400.0, "μg");
        addNutrient("구리", 0.8, 10.0, "mg");
        addNutrient("망간", 4.0, 11.0, "mg");
        addNutrient("크롬", 30.0, null, "μg"); // 상한 없음
        addNutrient("몰리브덴", 25.0, 600.0, "μg");
        addNutrient("요오드", 150.0, 2400.0, "μg");
        addNutrient("인", 700.0, 3500.0, "mg");
        addNutrient("칼륨", 3500.0, null, "mg"); // 상한 없음

        // ===== 오메가 지방산 =====
        addNutrient("EPA", 500.0, 3000.0, "mg"); // EPA+DHA 합산 기준
        addNutrient("DHA", 500.0, 3000.0, "mg");
        addNutrient("오메가-3", 500.0, 3000.0, "mg");

        // ===== 눈 건강 =====
        addNutrient("루테인", 10.0, 20.0, "mg"); // 일반적 권장량
        addNutrient("지아잔틴", 2.0, 4.0, "mg");

        // ===== 기타 =====
        addNutrient("코엔자임 Q10", 100.0, 300.0, "mg");
        addNutrient("프로바이오틱스", 1000000000.0, null, "CFU"); // 10억 CFU
        addNutrient("콜라겐", 2500.0, 15000.0, "mg");
        addNutrient("글루코사민", 1500.0, 3000.0, "mg");
        addNutrient("콘드로이틴", 800.0, 1200.0, "mg");
        addNutrient("MSM", 1000.0, 6000.0, "mg");

        // ===== 아미노산 =====
        addNutrient("로이신", 2000.0, 10000.0, "mg");
        addNutrient("아이소로이신", 1000.0, 5000.0, "mg");
        addNutrient("발린", 1000.0, 5000.0, "mg");
        addNutrient("라이신", 1000.0, 5000.0, "mg");
        addNutrient("메티오닌", 500.0, 3000.0, "mg");
        addNutrient("페닐알라닌", 500.0, 3000.0, "mg");
        addNutrient("트립토판", 250.0, 1000.0, "mg");
        addNutrient("트레오닌", 500.0, 3000.0, "mg");
        addNutrient("히스티딘", 500.0, 3000.0, "mg");
        addNutrient("아르기닌", 3000.0, 10000.0, "mg");
        addNutrient("글루타민", 5000.0, 30000.0, "mg");
        addNutrient("타우린", 500.0, 3000.0, "mg");
        addNutrient("시스테인", 500.0, 3000.0, "mg");
        addNutrient("티로신", 500.0, 3000.0, "mg");
        addNutrient("글리신", 1000.0, 10000.0, "mg");
        addNutrient("BCAA", 5000.0, 20000.0, "mg");

        // ===== 허브/식물 추출물 =====
        addNutrient("밀크씨슬", 200.0, 450.0, "mg");
        addNutrient("기링고불로바", 120.0, 240.0, "mg");
        addNutrient("인삼", 200.0, 2000.0, "mg");
        addNutrient("에키네이시아", 300.0, 1000.0, "mg");
        addNutrient("쏘팔메토", 320.0, 960.0, "mg");
        addNutrient("녹차추출물", 250.0, 500.0, "mg");
        addNutrient("가르시니아", 500.0, 2800.0, "mg");
        addNutrient("크래베리", 500.0, 2000.0, "mg");
        addNutrient("블루베리", 80.0, 500.0, "mg");
        addNutrient("스피룰리나", 3000.0, 10000.0, "mg");
        addNutrient("클로렐라", 2000.0, 10000.0, "mg");
        addNutrient("아사이베리", 500.0, 3000.0, "mg");
        addNutrient("맨손", 80.0, 500.0, "mg");

        // ===== 피부/모발 건강 =====
        addNutrient("히알루론산", 100.0, 200.0, "mg");
        addNutrient("케라틴", 500.0, 2000.0, "mg");
        addNutrient("세라마이드", 40.0, 100.0, "mg");
        addNutrient("엘라스틴", 200.0, 1000.0, "mg");
        addNutrient("아스타잔틴", 4.0, 12.0, "mg");

        // ===== 수면/스트레스 =====
        addNutrient("멜라토닌", 0.5, 5.0, "mg");
        addNutrient("발레리안부리추출물", 300.0, 900.0, "mg");
        addNutrient("GABA", 100.0, 750.0, "mg");
        addNutrient("테아닌", 100.0, 400.0, "mg");

        // ===== 소화 건강 =====
        addNutrient("소화효소", 100.0, null, "mg");
        addNutrient("프리바이오틱스", 2.5, null, "g");
        addNutrient("신바이오틱스", 1000000000.0, null, "CFU");
    }

    private static void addNutrient(String name, Double recommended, Double upper, String unit) {
        NUTRIENT_DATA.put(name, new NutrientInfo(
                recommended != null ? BigDecimal.valueOf(recommended) : null,
                upper != null ? BigDecimal.valueOf(upper) : null,
                unit));
    }

    /**
     * 성분의 권장섭취량 조회
     * 
     * @param ingredientName 표준화된 성분명
     * @return 권장섭취량 (없으면 null)
     */
    public BigDecimal getRecommendedIntake(String ingredientName) {
        NutrientInfo info = NUTRIENT_DATA.get(ingredientName);
        return info != null ? info.getRecommendedIntake() : null;
    }

    /**
     * 성분의 상한섭취량 조회
     * 
     * @param ingredientName 표준화된 성분명
     * @return 상한섭취량 (없으면 null = 상한 없음)
     */
    public BigDecimal getUpperLimit(String ingredientName) {
        NutrientInfo info = NUTRIENT_DATA.get(ingredientName);
        return info != null ? info.getUpperLimit() : null;
    }

    /**
     * 성분의 표준 단위 조회
     * 
     * @param ingredientName 표준화된 성분명
     * @return 표준 단위 (없으면 null)
     */
    public String getStandardUnit(String ingredientName) {
        NutrientInfo info = NUTRIENT_DATA.get(ingredientName);
        return info != null ? info.getUnit() : null;
    }

    /**
     * 해당 성분의 기준 데이터가 존재하는지 확인
     */
    public boolean hasData(String ingredientName) {
        return NUTRIENT_DATA.containsKey(ingredientName);
    }

    /**
     * 성분 정보를 전체 조회
     */
    public NutrientInfo getNutrientInfo(String ingredientName) {
        return NUTRIENT_DATA.get(ingredientName);
    }

    /**
     * 영양소 정보 DTO
     */
    @Getter
    public static class NutrientInfo {
        private final BigDecimal recommendedIntake; // 권장섭취량
        private final BigDecimal upperLimit; // 상한섭취량
        private final String unit; // 단위

        public NutrientInfo(BigDecimal recommendedIntake, BigDecimal upperLimit, String unit) {
            this.recommendedIntake = recommendedIntake;
            this.upperLimit = upperLimit;
            this.unit = unit;
        }

        /**
         * 상한섭취량이 설정되어 있는지 확인
         */
        public boolean hasUpperLimit() {
            return upperLimit != null;
        }
    }
}
