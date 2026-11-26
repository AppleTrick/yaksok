package com.ssafy.yaksok.analyze.service;

import com.ssafy.yaksok.analyze.client.AiServerClient;
import com.ssafy.yaksok.analyze.dto.FastApiAnalysisResult;
import com.ssafy.yaksok.analyze.dto.SupplementAnalysisResponse;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyzeService {

    private final AiServerClient aiServerClient;
    private final OcrAnalysisService ocrAnalysisService;
    private final ScanResultService scanResultService;

    public SupplementAnalysisResponse analyzeSupplement(MultipartFile file, Long userId) {
        long start = System.currentTimeMillis();
        FastApiAnalysisResult ai = aiServerClient.analyze(bytes(file));
        long aiDone = System.currentTimeMillis();

        // ONNX 서버 결과는 DB 후보만 붙인다. 요청 중에 LLM이 성분을 만들지 않는다.
        SupplementAnalysisResponse response = "ONNX".equals(ai.getStep())
                ? scanResultService.toResponse(userId, ai)
                : ocrAnalysisService.processAnalysisResult(userId, ai);

        log.info("[성능측정] AI 서버 {}ms, 결과 정리 {}ms", aiDone - start, System.currentTimeMillis() - aiDone);
        return response;
    }

    private static byte[] bytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.ANALYZE_INVALID_IMAGE);
        }
    }
}
