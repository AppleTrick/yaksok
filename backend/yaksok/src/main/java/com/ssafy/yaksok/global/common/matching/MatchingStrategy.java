//package com.ssafy.yaksok.global.common.matching;
//
//import java.util.Optional;
//
///**
// * 매칭 전략 인터페이스 (Strategy Pattern)
// *
// * 다양한 매칭 알고리즘을 정의합니다.
// *
// * @param <T> 매칭 대상 엔티티 타입
// */
//public interface MatchingStrategy<T> {
//
//    /**
//     * 매칭 시도
//     *
//     * @param query 검색 쿼리
//     * @return 매칭 결과 (없으면 Empty)
//     */
//    Optional<MatchResult<T>> match(String query);
//
//    /**
//     * 전략 이름
//     */
//    String getStrategyName();
//
//    /**
//     * 매칭 우선순위 (낮을수록 먼저 시도)
//     */
//    int getPriority();
//
//    /**
//     * 매칭 가능 여부 사전 확인
//     */
//    default boolean canMatch(String query) {
//        return query != null && !query.trim().isEmpty();
//    }
//}