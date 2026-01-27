package com.ssafy.yaksok.analyze.controller;

import com.ssafy.yaksok.analyze.domain.dto.OverdoseCheckResponse;
import com.ssafy.yaksok.analyze.domain.dto.SimulationProductRequest;
import com.ssafy.yaksok.analyze.service.OverdoseCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;


/**
 * 과복용 체크 Controller
 */
@RestController
@RequestMapping("/api/overdose")
@RequiredArgsConstructor
public class OverdoseController {

    private final OverdoseCheckService overdoseCheckService;

    /**
     * 사용자의 성분별 과복용 여부 확인
     * 
     * @param userId 사용자 ID
     * @return 성분별 과복용 boolean 목록
     */
    @GetMapping("/check")
    public ResponseEntity<OverdoseCheckResponse> checkOverdose(@RequestParam Long userId) {

        List<SimulationProductRequest> list=new ArrayList<>();
        list.add(new SimulationProductRequest(1L,3));
        list.add(new SimulationProductRequest(2L,3));
        OverdoseCheckResponse response = overdoseCheckService.checkOverdoseWithSimulation(userId,list);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/checkv2")
    public ResponseEntity<OverdoseCheckResponse> checkOverdosev2(@RequestParam Long userId) {

        OverdoseCheckResponse response = overdoseCheckService.checkOverdose(userId);
        return ResponseEntity.ok(response);
    }


}
