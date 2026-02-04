package com.ssafy.yaksok.product.repository;

import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.UserProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserProductRepository extends JpaRepository<UserProduct, Long> {
    @Query("""
        select new com.ssafy.yaksok.product.dto.UserProductResponse(
            up.id,
            p.id,
            p.prdlstNm,
            up.nickname,
            up.dailyDose,
            up.doseAmount,
            up.doseUnit,
            up.active
        )
        from UserProduct up
        join up.product p
        where up.user.id = :userId
    """)
    List<UserProductResponse> findUserProducts(Long userId);

    Optional<UserProduct> findByUserIdAndNickname(Long userId, String nickname);
}
