//package com.ssafy.yaksok.global.common.matching;
//
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//
///**
// * 매칭 결과 DTO
// * @param <T> 매칭된 엔티티 타입 (이 <T>가 없으면 에러가 납니다!)
// */
//@Getter
//@AllArgsConstructor
//@NoArgsConstructor
//public class MatchResult<T> { // <--- 여기 <T>가 반드시 있어야 합니다.
//
//    private T entity;
//    private double confidence;
//    private String strategyName;
//    private MatchType matchType;
//    private String additionalInfo;
//
//    public MatchResult(T entity, double confidence, String strategyName, MatchType matchType) {
//        this.entity = entity;
//        this.confidence = confidence;
//        this.strategyName = strategyName;
//        this.matchType = matchType;
//    }
//
//    public enum MatchType {
//        EXACT, FUZZY, GENERATED, BARCODE
//    }
//}