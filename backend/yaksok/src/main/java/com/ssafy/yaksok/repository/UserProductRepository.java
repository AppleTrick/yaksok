package com.ssafy.yaksok.repository;

import com.ssafy.yaksok.domain.entity.UserProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 사용자-제품 Repository
 * JpaRepository + QueryDSL Custom Repository
 */
@Repository
public interface UserProductRepository extends JpaRepository<UserProduct, Long>, UserProductRepositoryCustom {

    /**
     * 사용자의 활성화된 제품 목록 조회
     */
    List<UserProduct> findByUserIdAndActiveTrue(Long userId);
}
