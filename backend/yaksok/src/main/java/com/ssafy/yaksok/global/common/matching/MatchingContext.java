//package com.ssafy.yaksok.global.common.matching;
//
//import lombok.extern.slf4j.Slf4j;
//
//import java.util.Comparator;
//import java.util.List;
//import java.util.Optional;
//
//import com.ssafy.yaksok.global.common.matching.MatchResult;
//
//import com.ssafy.yaksok.global.common.matching.MatchResult;
//
///**
// * 매칭 컨텍스트 (Strategy Pattern Context)
// *
// * 여러 매칭 전략을 우선순위 순으로 실행합니다.
// *
// * @param <T> 매칭 대상 엔티티 타입
// */
//@Slf4j
//public class MatchingContext<T> {
//
//    private final List<MatchingStrategy<T>> strategies;
//
//    public MatchingContext(List<MatchingStrategy<T>> strategies) {
//        // 우선순위 순으로 정렬
//        this.strategies = strategies.stream()
//                .sorted(Comparator.comparingInt(MatchingStrategy::getPriority))
//                .toList();
//
//        log.info("매칭 컨텍스트 초기화: {}개 전략 등록", this.strategies.size());
//        this.strategies.forEach(s ->
//                log.debug("  - {} (우선순위: {})", s.getStrategyName(), s.getPriority())
//        );
//    }
//
//    /**
//     * 매칭 실행 (첫 번째 성공한 결과 반환)
//     *
//     * @param query 검색 쿼리
//     * @return 매칭 결과
//     * @throws MatchingFailedException 모든 전략 실패 시
//     */
//    public MatchResult<T> execute(String query) {
//        log.info("매칭 시작: query={}", query);
//
//        for (MatchingStrategy<T> strategy : strategies) {
//            if (!strategy.canMatch(query)) {
//                log.debug("[{}] canMatch() = false, 스킵", strategy.getStrategyName());
//                continue;
//            }
//
//            log.debug("[{}] 매칭 시도...", strategy.getStrategyName());
//
//            try {
//                Optional<MatchResult<T>> result = strategy.match(query);
//
//                if (result.isPresent()) {
//                    MatchResult<T> matchResult = result.get();
//                    log.info("매칭 성공: {} (전략: {}, 신뢰도: {})",
//                            query,
//                            matchResult.getStrategyName(),
//                            matchResult.getConfidence()
//                    );
//                    return matchResult;
//                } else {
//                    log.debug("[{}] 매칭 실패", strategy.getStrategyName());
//                }
//
//            } catch (Exception e) {
//                log.error("[{}] 매칭 중 오류: {}", strategy.getStrategyName(), e.getMessage());
//                // 오류 발생 시에도 다음 전략 계속 시도
//            }
//        }
//
//        log.error("모든 매칭 전략 실패: {}", query);
//        throw new MatchingFailedException("매칭 실패: " + query);
//    }
//
//    /**
//     * 안전한 매칭 실행 (실패 시 null 반환)
//     */
//    public MatchResult<T> executeSafe(String query) {
//        try {
//            return execute(query);
//        } catch (MatchingFailedException e) {
//            log.warn("매칭 실패 (null 반환): {}", query);
//            return null;
//        }
//    }
//
//    /**
//     * 모든 전략 시도 및 결과 수집
//     */
//    public List<MatchResult<T>> executeAll(String query) {
//        log.info("모든 전략 시도: query={}", query);
//
//        return strategies.stream()
//                .filter(strategy -> strategy.canMatch(query))
//                .map(strategy -> {
//                    try {
//                        return strategy.match(query);
//                    } catch (Exception e) {
//                        log.error("[{}] 매칭 중 오류: {}",
//                                strategy.getStrategyName(), e.getMessage());
//                        return Optional.<MatchResult<T>>empty();
//                    }
//                })
//                .filter(Optional::isPresent)
//                .map(Optional::get)
//                .toList();
//    }
//
//    /**
//     * 등록된 전략 목록
//     */
//    public List<String> getStrategyNames() {
//        return strategies.stream()
//                .map(MatchingStrategy::getStrategyName)
//                .toList();
//    }
//}