package com.ssafy.yaksok.ingredient.util;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * 성분명 정규화 유틸리티
 * 
 * 다양한 형태로 입력되는 성분명을 표준 형식으로 변환합니다.
 * 예: "티아민", "비타민B1", "B1", "티아민(비타민B1)" → "비타민 B1"
 */
@Component
public class IngredientNameNormalizer {

    /**
     * 성분명 별칭 매핑 테이블
     * Key: 정규화된 소문자 별칭, Value: 표준 성분명
     */
    private static final Map<String, String> ALIAS_MAP = new HashMap<>();

    static {
        // ===== 비타민 B군 =====
        addAliases("비타민 B1",
                "비타민b1", "비타민 b1", "b1", "티아민", "thiamin", "thiamine",
                "비타민b1(티아민)", "티아민(비타민b1)", "비타민 b1 (티아민)", "티아민 (비타민 b1)");

        addAliases("비타민 B2",
                "비타민b2", "비타민 b2", "b2", "리보플라빈", "riboflavin",
                "비타민b2(리보플라빈)", "리보플라빈(비타민b2)", "비타민 b2 (리보플라빈)");

        addAliases("비타민 B3",
                "비타민b3", "비타민 b3", "b3", "나이아신", "니아신", "niacin", "니코틴산",
                "비타민b3(나이아신)", "나이아신(비타민b3)", "비타민 b3 (나이아신)");

        addAliases("비타민 B5",
                "비타민b5", "비타민 b5", "b5", "판토텐산", "pantothenic acid", "판토텐산칼슘",
                "비타민b5(판토텐산)", "판토텐산(비타민b5)", "비타민 b5 (판토텐산)");

        addAliases("비타민 B6",
                "비타민b6", "비타민 b6", "b6", "피리독신", "pyridoxine",
                "비타민b6(피리독신)", "피리독신(비타민b6)", "비타민 b6 (피리독신)");

        addAliases("비타민 B7",
                "비타민b7", "비타민 b7", "b7", "비오틴", "biotin",
                "비타민b7(비오틴)", "비오틴(비타민b7)", "비타민 b7 (비오틴)", "비타민h");

        addAliases("비타민 B9",
                "비타민b9", "비타민 b9", "b9", "엽산", "folate", "folic acid", "폴산",
                "비타민b9(엽산)", "엽산(비타민b9)", "비타민 b9 (엽산)");

        addAliases("비타민 B12",
                "비타민b12", "비타민 b12", "b12", "코발라민", "cobalamin", "시아노코발라민",
                "비타민b12(코발라민)", "코발라민(비타민b12)", "비타민 b12 (코발라민)");

        // ===== 기타 비타민 =====
        addAliases("비타민 A",
                "비타민a", "비타민 a", "레티놀", "retinol", "베타카로틴", "beta-carotene");

        addAliases("비타민 C",
                "비타민c", "비타민 c", "아스코르빈산", "ascorbic acid", "아스코르브산");

        addAliases("비타민 D",
                "비타민d", "비타민 d", "콜레칼시페롤", "cholecalciferol", "비타민d3", "비타민 d3", "d3");

        addAliases("비타민 E",
                "비타민e", "비타민 e", "토코페롤", "tocopherol", "알파토코페롤", "d-알파-토코페롤");

        addAliases("비타민 K",
                "비타민k", "비타민 k", "비타민k1", "비타민k2", "필로퀴논", "메나퀴논");

        // ===== 미네랄 =====
        addAliases("칼슘", "calcium", "ca", "탄산칼슘", "구연산칼슘");
        addAliases("마그네슘", "magnesium", "mg금속", "산화마그네슘");
        addAliases("아연", "zinc", "zn", "글루콘산아연", "황산아연");
        addAliases("철분", "iron", "fe", "철", "황산제일철", "푸마르산철");
        addAliases("셀레늄", "selenium", "se", "셀렌", "아셀렌산나트륨");
        addAliases("구리", "copper", "cu", "황산구리");
        addAliases("망간", "manganese", "mn", "황산망간");
        addAliases("크롬", "chromium", "cr", "크로뮴");
        addAliases("몰리브덴", "molybdenum", "mo", "몰리브데넘");
        addAliases("요오드", "iodine", "아이오딘", "요오드화칼륨");
        addAliases("인", "phosphorus", "p", "인산");
        addAliases("칼륨", "potassium", "k금속", "염화칼륨");

        // ===== 오메가 지방산 =====
        addAliases("EPA", "eicosapentaenoic acid", "이코사펜타엔산");
        addAliases("DHA", "docosahexaenoic acid", "도코사헥사엔산");
        addAliases("오메가-3", "오메가3", "omega-3", "omega3", "오메가 3");

        // ===== 눈 건강 =====
        addAliases("루테인", "lutein");
        addAliases("지아잔틴", "zeaxanthin", "제아잔틴");

        // ===== 기타 =====
        addAliases("코엔자임 Q10", "coq10", "코큐텐", "유비퀴놀", "유비퀴논", "코엔자임q10");
        addAliases("프로바이오틱스", "probiotics", "유산균", "락토바실러스", "비피더스");
        addAliases("콜라겐", "collagen", "피쉬콜라겐", "저분자콜라겐");
        addAliases("글루코사민", "glucosamine");
        addAliases("콘드로이틴", "chondroitin");
        addAliases("MSM", "메틸설포닐메탄", "methylsulfonylmethane");

        // ===== 아미노산 =====
        addAliases("로이신", "leucine", "l-leucine", "l-로이신");
        addAliases("아이소로이신", "isoleucine", "l-isoleucine", "l-아이소로이신");
        addAliases("발린", "valine", "l-valine", "l-발린");
        addAliases("라이신", "lysine", "l-lysine", "l-라이신");
        addAliases("메티오닌", "methionine", "l-methionine", "l-메티오닌");
        addAliases("페닐알라닌", "phenylalanine", "l-phenylalanine");
        addAliases("트립토판", "tryptophan", "l-tryptophan", "l-트립토판");
        addAliases("트레오닌", "threonine", "l-threonine", "l-트레오닌");
        addAliases("히스티딘", "histidine", "l-histidine", "l-히스티딘");
        addAliases("아르기닌", "arginine", "l-arginine", "l-아르기닌");
        addAliases("글루타민", "glutamine", "l-glutamine", "l-글루타민");
        addAliases("타우린", "taurine", "l-taurine");
        addAliases("시스테인", "cysteine", "l-cysteine", "시스틴", "l-시스테인");
        addAliases("티로신", "tyrosine", "l-tyrosine", "l-티로신");
        addAliases("글리신", "glycine");
        addAliases("BCAA", "bcaas", "분지사슬아미노산");

        // ===== 허브/식물 추출물 =====
        addAliases("밀크씨슬", "milk thistle", "실리마린", "silymarin");
        addAliases("기링고불로바", "ginkgo biloba", "은행엽", "은행엽추출물");
        addAliases("인삼", "ginseng", "홍삼", "인삼엑스", "panax ginseng");
        addAliases("에키네이시아", "echinacea");
        addAliases("쏘팔메토", "saw palmetto", "쏘팔메토추출물");
        addAliases("녹차추출물", "green tea extract", "egcg", "카테킨");
        addAliases("가르시니아", "garcinia", "가르시니아캄보지아", "hca");
        addAliases("크래베리", "cranberry", "크랜베리추출물");
        addAliases("블루베리", "blueberry", "빌베리추출물");
        addAliases("스피룰리나", "spirulina", "스피룰리나추출물");
        addAliases("클로렐라", "chlorella", "클로렐라");
        addAliases("아사이베리", "acai berry", "아사이추출물");
        addAliases("맨손", "bilberry", "맨손추출물");

        // ===== 피부/모발 건강 =====
        addAliases("히알루론산", "hyaluronic acid", "히알루론", "ha");
        addAliases("케라틴", "keratin", "가수분해케라틴");
        addAliases("세라마이드", "ceramide", "세라마이드추출물");
        addAliases("엘라스틴", "elastin");
        addAliases("아스타잔틴", "astaxanthin", "아스타잔틴");

        // ===== 수면/스트레스 =====
        addAliases("멜라토닌", "melatonin");
        addAliases("발레리안부리추출물", "valerian", "발레리안");
        addAliases("GABA", "gamma-aminobutyric acid", "감마아미노부티르산", "가바");
        addAliases("테아닌", "theanine", "l-theanine", "l-테아닌");

        // ===== 소화 건강 =====
        addAliases("소화효소", "digestive enzymes", "프로테아제", "아밀라제", "립아제");
        addAliases("프리바이오틱스", "prebiotics", "프렉토올리고당", "fos", "fructooligosaccharides");
        addAliases("신바이오틱스", "synbiotics", "칸바이오틱스");
    }

    /**
     * 별칭들을 매핑 테이블에 추가하는 헬퍼 메서드
     */
    private static void addAliases(String standardName, String... aliases) {
        // 표준 이름 자체도 매핑에 추가 (소문자, 공백제거 버전)
        String normalizedStandard = normalizeForLookup(standardName);
        ALIAS_MAP.put(normalizedStandard, standardName);

        for (String alias : aliases) {
            String normalizedAlias = normalizeForLookup(alias);
            ALIAS_MAP.put(normalizedAlias, standardName);
        }
    }

    /**
     * 룩업용 정규화 (소문자, 공백/특수문자 제거)
     */
    private static String normalizeForLookup(String name) {
        if (name == null)
            return "";
        return name.toLowerCase()
                .replaceAll("\\s+", "")
                .replaceAll("[^a-z0-9가-힣]", "");
    }

    /**
     * 성분명을 표준 형식으로 정규화합니다.
     * 
     * @param ingredientName 원본 성분명
     * @return 표준화된 성분명 (매핑이 없으면 트림된 원본 반환)
     */
    public String normalize(String ingredientName) {
        if (ingredientName == null || ingredientName.trim().isEmpty()) {
            return ingredientName;
        }

        String lookupKey = normalizeForLookup(ingredientName);
        String standardName = ALIAS_MAP.get(lookupKey);

        if (standardName != null) {
            return standardName;
        }

        // 매핑에 없으면 기본 정리만 수행 (앞뒤 공백 제거, 연속 공백 단일화)
        return ingredientName.trim().replaceAll("\\s+", " ");
    }

    /**
     * 해당 성분명이 알려진 성분인지 확인합니다.
     */
    public boolean isKnownIngredient(String ingredientName) {
        if (ingredientName == null)
            return false;
        String lookupKey = normalizeForLookup(ingredientName);
        return ALIAS_MAP.containsKey(lookupKey);
    }

    /**
     * 등록된 모든 표준 성분명 목록을 반환합니다.
     */
    public static java.util.Set<String> getAllStandardNames() {
        return new java.util.HashSet<>(ALIAS_MAP.values());
    }
}
