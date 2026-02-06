package com.ssafy.yaksok.disease.repository;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.disease.entity.UserDisease;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserDiseaseRepository extends JpaRepository<UserDisease, Long> {

    /**
     * 사용자의 질병 목록 조회
     */
    @Query("""
    select ud.disease
    from UserDisease ud
    where ud.user.id = :userId
    """)
    List<Disease> findDiseasesByUserId(@Param("userId") Long userId);

    /**
     * 사용자의 모든 질병 정보 삭제
     *
     * clearAutomatically: 삭제 후 영속성 컨텍스트 자동 clear
     * flushAutomatically: 삭제 전 pending 변경사항 자동 flush
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from UserDisease ud where ud.user.id = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}