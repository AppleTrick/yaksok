package com.ssafy.yaksok.product.repository;

import com.ssafy.yaksok.product.entity.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @EntityGraph(attributePaths = { "productIngredients", "productIngredients.ingredient" })
    Optional<Product> findByPrdlstNm(String prdlstNm);

    @EntityGraph(attributePaths = { "productIngredients", "productIngredients.ingredient" })
    List<Product> findByPrdlstNmContaining(String prdlstNm);
}
