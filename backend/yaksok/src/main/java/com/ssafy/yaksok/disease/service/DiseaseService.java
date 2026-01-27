package com.ssafy.yaksok.disease.service;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.repository.DiseaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@RequiredArgsConstructor
@Service
public class DiseaseService {

    public final DiseaseRepository diseaseRepository;

    public List<Disease> findAllDisease(){
        return diseaseRepository.findAll();
    }
}
