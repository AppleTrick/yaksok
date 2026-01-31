package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.internal.AnalysisTarget;
import com.ssafy.yaksok.product.entity.Product;
import com.ssafy.yaksok.product.service.ProductMatchingService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.openkoreantext.processor.OpenKoreanTextProcessorJava;
import org.openkoreantext.processor.phrase_extractor.KoreanPhraseExtractor;
import org.openkoreantext.processor.tokenizer.KoreanTokenizer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import scala.collection.Seq;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProductLinker {

    private final ProductMatchingService productMatchingService;

    // Stage 1: Regex 패턴 (노이즈 제거용)
    private static final Pattern AMOUNT_PATTERN = Pattern.compile("\\d+(\\.\\d+)?(mg|g|ml|kcal|ug|mcg|%|정|캡슐|포)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DATE_PATTERN = Pattern
            .compile("\\d{4}[-./]?\\d{0,2}[-./]?\\d{0,2}|\\d{4}년|\\d{2}[./]\\d{2}");
    private static final Pattern NOISE_PATTERN = Pattern.compile("[^가-힣a-zA-Z0-9\\s]"); // 특수문자
    private static final Pattern NUMBER_ONLY_PATTERN = Pattern.compile("^\\d+$");
    // 영문+숫자 조합 노이즈 (HALE, YaD, H1, 608 등)
    private static final Pattern ALPHA_NUM_NOISE = Pattern.compile("^[a-zA-Z0-9]+$");

    // Stage 2: StopWords
    private Set<String> stopWords = new HashSet<>();

    // 코드 레벨 필수 제거 목록 (stopwords.txt와 별개로 무조건 필터링)
    private static final Set<String> HARDCODED_NOISE_WORDS = Set.of(
            "가능품", "가능", "건강", "기능", "식품", "9가지", "맛있는",
            "구미젤리", "KA의스", "OEM", "함유", "섭취");

    // OKT 초기화 여부
    private boolean oktInitialized = false;

    @PostConstruct
    public void initialize() {
        // StopWords 로드
        loadStopWords();

        // OKT 초기화 (사전 로딩)
        try {
            log.info("[LINKER] Open Korean Text 초기화 중...");
            // 더미 호출로 사전 미리 로드 (처음 호출 시 2-3초 소요)
            OpenKoreanTextProcessorJava.normalize("초기화");
            oktInitialized = true;
            log.info("[LINKER] Open Korean Text 초기화 완료");
        } catch (Exception e) {
            log.warn("[LINKER] OKT 초기화 실패, 명사 추출 비활성화: {}", e.getMessage());
            oktInitialized = false;
        }
    }

    private void loadStopWords() {
        try {
            ClassPathResource resource = new ClassPathResource("data/stopwords.txt");
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                stopWords = reader.lines()
                        .map(String::trim)
                        .filter(line -> !line.isEmpty())
                        .collect(Collectors.toSet());
                log.info("[LINKER] StopWords 로드 완료: {}개", stopWords.size());
            }
        } catch (Exception e) {
            log.warn("[LINKER] StopWords 파일 로드 실패, 기본 세트 사용: {}", e.getMessage());
            stopWords = Set.of("건강기능식품", "OEM", "내용량", "원료명", "섭취방법", "유통기한");
        }
    }

    public List<AnalysisTarget> linkProducts(FastApiAnalysisResult aiResult) {
        log.info("========================================");
        log.info("[LINKER] 🔗 제품 매칭 시작 (4-Stage Pipeline)");

        if (aiResult == null || aiResult.getAnalysisResults() == null) {
            log.warn("[LINKER] ⚠️ AI 결과가 비어있음");
            return new ArrayList<>();
        }

        int totalItems = aiResult.getAnalysisResults().size();
        log.info("[LINKER] 📦 처리 대상: {}개 객체", totalItems);

        long startTime = System.currentTimeMillis();

        // Thread Safety: parallelStream() -> stream()으로 변경 (DB 세션 충돌 방지)
        List<AnalysisTarget> results = new ArrayList<>();
        int idx = 0;

        for (var raw : aiResult.getAnalysisResults()) {
            idx++;
            // OCR 텍스트 수집
            List<String> ocrTexts = raw.getOcrTexts() != null ? raw.getOcrTexts() : new ArrayList<>();
            String originalText = String.join(" ", ocrTexts);

            log.info("[LINKER] ──── 객체 {}/{} 처리 시작 ────", idx, totalItems);
            log.info("[LINKER] 📝 원본 OCR: {}", ocrTexts);

            try {
                // Stage 1~3: 텍스트 정제 및 최적 키워드 추출
                String topKeyword = extractTopKeyword(ocrTexts, raw.getOcrLines());

                if (topKeyword == null || topKeyword.isBlank()) {
                    log.info("[LINKER] ❌ 유효한 키워드 없음 → Type B로 보존");
                    results.add(AnalysisTarget.builder()
                            .product(null)
                            .ocrName(originalText)
                            .rawResult(raw)
                            .build());
                    continue;
                }

                log.info("[LINKER] 🎯 Top 키워드 선정: '{}'", topKeyword);

                // Stage 4: DB 매칭
                Product product = productMatchingService.findProduct(topKeyword);

                if (product != null) {
                    log.info("[LINKER] ✅ DB 매칭 성공 → Type A: '{}'", product.getPrdlstNm());
                } else {
                    log.info("[LINKER] ❌ DB 매칭 실패 → Type B (정제 키워드: '{}')", topKeyword);
                }

                // Type B: 전체 OCR 텍스트 대신 정제된 키워드를 ocrName으로 설정
                // 프론트 출력 시 "HALE 건강..." 대신 "센트롱 (추정)" 형태로 표시됨
                String displayName = product != null
                        ? product.getPrdlstNm()
                        : topKeyword + " (추정)";

                results.add(AnalysisTarget.builder()
                        .product(product)
                        .ocrName(displayName)
                        .rawResult(raw)
                        .build());

            } catch (Exception e) {
                log.error("[LINKER] ⚠️ 처리 중 오류 (무시): {}", e.getMessage());
                results.add(AnalysisTarget.builder()
                        .ocrName("알 수 없음")
                        .rawResult(raw)
                        .build());
            }
        }

        long elapsed = System.currentTimeMillis() - startTime;
        long typeACount = results.stream().filter(r -> r.getProduct() != null).count();
        long typeBCount = results.size() - typeACount;

        log.info("========================================");
        log.info("[LINKER] 📊 매칭 완료 요약");
        log.info("[LINKER]   - 총 처리: {}개", results.size());
        log.info("[LINKER]   - Type A (DB 매칭): {}개", typeACount);
        log.info("[LINKER]   - Type B (원본 보존): {}개", typeBCount);
        log.info("[LINKER]   - 소요 시간: {}ms", elapsed);
        log.info("========================================");

        return results;
    }

    /**
     * Stage 1~3: OCR 텍스트에서 최적의 제품명 키워드 추출
     */
    private String extractTopKeyword(List<String> ocrTexts, List<FastApiAnalysisResult.OcrLine> ocrLines) {
        if (ocrTexts == null || ocrTexts.isEmpty()) {
            return null;
        }

        // 신뢰도 맵 생성
        Map<String, Double> confidenceMap = new HashMap<>();
        if (ocrLines != null) {
            for (FastApiAnalysisResult.OcrLine line : ocrLines) {
                if (line.getText() != null) {
                    confidenceMap.put(line.getText().trim(), line.getConfidence());
                }
            }
        }

        List<ScoredKeyword> candidates = new ArrayList<>();

        for (String text : ocrTexts) {
            // Stage 1: Regex Filtering
            String cleaned = applyRegexFiltering(text);
            if (cleaned.isBlank())
                continue;

            // Stage 2: StopWords Filtering
            if (isStopWord(cleaned))
                continue;

            double confidence = confidenceMap.getOrDefault(text.trim(), 0.5);

            // ═══════════════════════════════════════════════════════════════
            // 고유명사 보호 로직: 3~6자 순수 한글은 OKT 분석 건너뛰기
            // 예: '비맥스', '센트롱', '센트룸' 등은 쪼개지 않고 그대로 사용
            // ═══════════════════════════════════════════════════════════════
            String koreanOnly = cleaned.replaceAll("[^가-힣]", "");
            boolean isProperNoun = koreanOnly.length() >= 3 && koreanOnly.length() <= 6
                    && koreanOnly.equals(cleaned.replaceAll("\\s", ""));

            if (isProperNoun) {
                // 고유명사 후보: OKT 분석 없이 원본 그대로 사용 + 높은 가점
                double score = calculateScore(cleaned, confidence) + 8.0; // 고유명사 보너스
                candidates.add(new ScoredKeyword(cleaned, score));
                log.info("[Stage 2.5] 🛡️ 고유명사 보호: '{}' (score: {:.1f})", cleaned, score);
                continue;
            }

            // Stage 2.5: 명사 추출 (OKT 활성화된 경우, 7자 이상 복합어)
            List<String> nouns = extractNouns(cleaned);
            if (!nouns.isEmpty()) {
                // 명사가 추출된 경우, 각 명사에 대해 점수 계산
                for (String noun : nouns) {
                    if (noun.length() >= 2 && !isStopWord(noun)) {
                        double score = calculateScore(noun, confidence);
                        if (score > 0) {
                            candidates.add(new ScoredKeyword(noun, score));
                        }
                    }
                }
                // 원본도 후보에 추가 (낮은 점수로)
                double originalScore = calculateScore(cleaned, confidence) * 0.7;
                if (originalScore > 0) {
                    candidates.add(new ScoredKeyword(cleaned, originalScore));
                }
            } else {
                // OKT 미사용 또는 명사 없음: 원본 사용
                double score = calculateScore(cleaned, confidence);
                if (score > 0) {
                    candidates.add(new ScoredKeyword(cleaned, score));
                }
            }
        }

        if (candidates.isEmpty()) {
            return null;
        }

        // 점수 기준 내림차순 정렬 후 Top 1 반환
        candidates.sort((a, b) -> Double.compare(b.score, a.score));
        ScoredKeyword top = candidates.get(0);
        log.debug("[LINKER] Top Keyword: '{}' (score: {:.2f})", top.keyword, top.score);
        return top.keyword;
    }

    /**
     * Stage 1: Regex 필터링 (함량, 날짜, 특수문자 + 언어별 필터링)
     */
    private String applyRegexFiltering(String text) {
        String original = text;
        String result = text;

        // 1. 함량/날짜/특수문자 제거
        result = AMOUNT_PATTERN.matcher(result).replaceAll("");
        result = DATE_PATTERN.matcher(result).replaceAll("");
        result = NOISE_PATTERN.matcher(result).replaceAll(" ");
        result = result.replaceAll("\\s+", " ").trim();

        // 2. 언어별 필터링
        if (result.isBlank()) {
            return "";
        }

        // 한글 포함 여부 확인
        boolean hasKorean = result.matches(".*[가-힣].*");

        // 영문+숫자 혼합만 있는 경우 (HALE, YaD, H1, 608 등) - 한글 없으면 제거
        if (!hasKorean && ALPHA_NUM_NOISE.matcher(result.replaceAll("\\s", "")).matches()) {
            log.debug("[Stage 1] 🚫 영문+숫자 노이즈 제거: '{}'", original);
            return "";
        }

        // 한글: 최소 2자, 영문: 최소 3자
        if (hasKorean) {
            String koreanOnly = result.replaceAll("[^가-힣]", "");
            if (koreanOnly.length() < 2) {
                log.debug("[Stage 1] 🚫 한글 2자 미만 제거: '{}'", original);
                return "";
            }
        } else {
            // 순수 영문인 경우 3자 이상만 허용
            if (result.length() < 3) {
                log.debug("[Stage 1] 🚫 영문 3자 미만 제거: '{}'", original);
                return "";
            }
        }

        if (!result.equals(original)) {
            log.debug("[Stage 1] ✅ 정제: '{}' → '{}'", original, result);
        }
        return result;
    }

    /**
     * Stage 2: StopWord 체크
     */
    private boolean isStopWord(String text) {
        String normalized = text.toLowerCase().trim();

        // 1. 하드코딩 금칙어 우선 체크
        if (HARDCODED_NOISE_WORDS.stream()
                .anyMatch(sw -> normalized.contains(sw.toLowerCase()))) {
            log.debug("[Stage 2] 🚫 하드코딩 금칙어 감지: '{}'", text);
            return true;
        }

        // 2. stopwords.txt 체크
        return stopWords.stream()
                .anyMatch(sw -> normalized.contains(sw.toLowerCase()));
    }

    /**
     * Stage 3: 점수 계산 (한글 가점 + 길이 + 신뢰도)
     */
    private double calculateScore(String text, double confidence) {
        int len = text.length();
        double score = 0.0;

        // 숫자만 있는 경우 제외
        if (NUMBER_ONLY_PATTERN.matcher(text).matches()) {
            return 0;
        }

        // 영문+숫자 혼합만 있으면 제외 (한글 없는 경우)
        boolean hasKorean = text.matches(".*[가-힣].*");
        if (!hasKorean && ALPHA_NUM_NOISE.matcher(text.replaceAll("\\s", "")).matches()) {
            return 0;
        }

        // 1. 한글 가점: 순수 한글 명사에 +10점
        if (hasKorean) {
            score += 10.0;
        }

        // 2. 길이 점수: 3~8자가 최적
        if (len >= 3 && len <= 8) {
            score += 5.0; // 최적 길이
        } else if (len >= 2 && len <= 12) {
            score += 3.0; // 허용 범위
        } else {
            score += 1.0; // 감점
        }

        // 3. 신뢰도 가중치 (0~1 사이 값 * 5)
        score += confidence * 5.0;

        log.debug("[Stage 3] 점수: '{}' → {:.1f}점 (한글:{}, 길이:{}, conf:{:.2f})",
                text, score, hasKorean, len, confidence);

        return score;
    }

    /**
     * Stage 2.5: OKT를 사용하여 명사만 추출
     */
    private List<String> extractNouns(String text) {
        if (!oktInitialized || text == null || text.isBlank()) {
            return Collections.emptyList();
        }

        try {
            // 텍스트 정규화
            CharSequence normalized = OpenKoreanTextProcessorJava.normalize(text);

            // 토큰화
            Seq<KoreanTokenizer.KoreanToken> tokens = OpenKoreanTextProcessorJava.tokenize(normalized);

            // 명사(Noun)만 추출
            List<String> nouns = new ArrayList<>();
            scala.collection.Iterator<KoreanTokenizer.KoreanToken> iterator = tokens.iterator();
            while (iterator.hasNext()) {
                KoreanTokenizer.KoreanToken token = iterator.next();
                // 명사(Noun) 타입만 필터링
                if (token.pos().toString().equals("Noun")) {
                    String noun = token.text();
                    if (noun.length() >= 2) { // 2자 이상만
                        nouns.add(noun);
                    }
                }
            }

            if (!nouns.isEmpty()) {
                log.debug("[LINKER] 명사 추출: {} -> {}", text, nouns);
            }
            return nouns;

        } catch (Exception e) {
            log.debug("[LINKER] 명사 추출 실패, 원본 사용: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 점수가 매겨진 키워드
     */
    private record ScoredKeyword(String keyword, double score) {
    }
}
