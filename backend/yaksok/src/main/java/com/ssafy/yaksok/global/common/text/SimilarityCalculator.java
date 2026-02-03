package com.ssafy.yaksok.global.common.text;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 문자열 유사도 계산 유틸리티
 *
 * Levenshtein Distance, Jaro-Winkler 등의 알고리즘을 제공합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SimilarityCalculator {

    private final TextNormalizer textNormalizer;

    /**
     * Levenshtein Distance 기반 유사도 계산
     *
     * @param s1 첫 번째 문자열
     * @param s2 두 번째 문자열
     * @return 0.0 ~ 1.0 (1.0 = 완전 일치)
     */
    public double calculateSimilarity(String s1, String s2) {
        return calculateSimilarity(s1, s2, true);
    }

    /**
     * Levenshtein Distance 기반 유사도 계산 (정규화 옵션)
     */
    public double calculateSimilarity(String s1, String s2, boolean normalize) {
        if (s1 == null || s2 == null) {
            return 0.0;
        }

        String str1 = normalize ? textNormalizer.normalize(s1) : s1;
        String str2 = normalize ? textNormalizer.normalize(s2) : s2;

        if (str1.isEmpty() && str2.isEmpty()) {
            return 1.0;
        }

        int distance = levenshteinDistance(str1, str2);
        int maxLength = Math.max(str1.length(), str2.length());

        if (maxLength == 0) {
            return 1.0;
        }

        return 1.0 - ((double) distance / maxLength);
    }

    /**
     * Levenshtein Distance 계산
     *
     * 동적 프로그래밍을 사용하여 두 문자열 간의 편집 거리를 계산합니다.
     */
    public int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        // 초기화
        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        // DP 테이블 채우기
        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;

                dp[i][j] = Math.min(
                        Math.min(
                                dp[i - 1][j] + 1,      // 삭제
                                dp[i][j - 1] + 1       // 삽입
                        ),
                        dp[i - 1][j - 1] + cost        // 치환
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }

    /**
     * Jaro-Winkler 유사도 계산 (한글 친화적)
     *
     * 짧은 문자열이나 접두사가 같은 경우 더 높은 점수를 부여합니다.
     */
    public double calculateJaroWinklerSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) {
            return 0.0;
        }

        String str1 = textNormalizer.normalize(s1);
        String str2 = textNormalizer.normalize(s2);

        if (str1.isEmpty() && str2.isEmpty()) {
            return 1.0;
        }

        // Jaro 유사도 계산
        double jaroSimilarity = calculateJaroSimilarity(str1, str2);

        // 공통 접두사 길이 계산 (최대 4)
        int prefixLength = 0;
        int minLength = Math.min(Math.min(str1.length(), str2.length()), 4);

        for (int i = 0; i < minLength; i++) {
            if (str1.charAt(i) == str2.charAt(i)) {
                prefixLength++;
            } else {
                break;
            }
        }

        // Jaro-Winkler 계산
        double p = 0.1; // 스케일링 팩터
        return jaroSimilarity + (prefixLength * p * (1 - jaroSimilarity));
    }

    /**
     * Jaro 유사도 계산
     */
    private double calculateJaroSimilarity(String s1, String s2) {
        if (s1.equals(s2)) {
            return 1.0;
        }

        int len1 = s1.length();
        int len2 = s2.length();

        if (len1 == 0 || len2 == 0) {
            return 0.0;
        }

        // 매칭 윈도우
        int maxDistance = Math.max(len1, len2) / 2 - 1;

        boolean[] s1Matches = new boolean[len1];
        boolean[] s2Matches = new boolean[len2];

        int matches = 0;
        int transpositions = 0;

        // 매칭 찾기
        for (int i = 0; i < len1; i++) {
            int start = Math.max(0, i - maxDistance);
            int end = Math.min(i + maxDistance + 1, len2);

            for (int j = start; j < end; j++) {
                if (s2Matches[j] || s1.charAt(i) != s2.charAt(j)) {
                    continue;
                }
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches == 0) {
            return 0.0;
        }

        // 전치 계산
        int k = 0;
        for (int i = 0; i < len1; i++) {
            if (!s1Matches[i]) {
                continue;
            }
            while (!s2Matches[k]) {
                k++;
            }
            if (s1.charAt(i) != s2.charAt(k)) {
                transpositions++;
            }
            k++;
        }

        return ((double) matches / len1
                + (double) matches / len2
                + (double) (matches - transpositions / 2.0) / matches) / 3.0;
    }

    /**
     * 부분 매칭 여부 확인
     *
     * s1이 s2에 포함되는지 확인합니다.
     */
    public boolean isPartialMatch(String s1, String s2) {
        String normalized1 = textNormalizer.normalize(s1);
        String normalized2 = textNormalizer.normalize(s2);

        return normalized2.contains(normalized1) || normalized1.contains(normalized2);
    }

    /**
     * 최적 유사도 계산
     *
     * 여러 알고리즘 중 가장 높은 점수를 반환합니다.
     */
    public double calculateBestSimilarity(String s1, String s2) {
        double levenshtein = calculateSimilarity(s1, s2);
        double jaroWinkler = calculateJaroWinklerSimilarity(s1, s2);

        return Math.max(levenshtein, jaroWinkler);
    }
}