package com.ssafy.yaksok.disease.service;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.entity.UserDisease;
import com.ssafy.yaksok.disease.repository.UserDiseaseRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class UserDiseaseService {
    private final UserDiseaseRepository userDiseaseRepository;

    public List<Disease> getUserDisease(long userId){
        return userDiseaseRepository.findDiseasesByUserId(userId);
    }
}
