package com.ssafy.yaksok.disease.repository;

import com.ssafy.yaksok.disease.entity.Disease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DiseaseRepository extends JpaRepository<Disease, Long> {
    boolean existsBySickName(String sickName);
    Optional<Disease> findBySickName(String sickName);
}
