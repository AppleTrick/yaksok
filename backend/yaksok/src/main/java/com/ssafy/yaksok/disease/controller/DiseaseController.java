package com.ssafy.yaksok.disease.controller;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.repository.DiseaseRepository;
import com.ssafy.yaksok.disease.service.DiseaseService;
import com.ssafy.yaksok.global.dto.ApiResponse;
import com.ssafy.yaksok.global.util.ResponseUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/diseases")
public class DiseaseController {

    private final DiseaseService diseaseService;

    @GetMapping("")
    public ResponseEntity<ApiResponse<List<Disease>>> getDisease(){
        return ResponseUtil.ok(diseaseService.findAllDisease());
    }
}
