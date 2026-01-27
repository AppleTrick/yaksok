package com.ssafy.yaksok.disease.repository;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.entity.UserDisease;
import com.ssafy.yaksok.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserDiseaseRepository extends JpaRepository<UserDisease, Long> {

    @Query("""
    select ud.disease
    from UserDisease ud
    where ud.user.id = :userId
    """)
    List<Disease> findDiseasesByUserId(@Param("userId") Long userId);

}
