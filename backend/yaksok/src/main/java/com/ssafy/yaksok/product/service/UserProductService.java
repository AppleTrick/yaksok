package com.ssafy.yaksok.product.service;

import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.UserProduct;
import com.ssafy.yaksok.product.repository.UserProductRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class UserProductService {
    private UserProductRepository userProductRepository;

    public List<UserProductResponse> findUserProducts(Long userId) {
        return userProductRepository.findUserProducts(userId);
    }

}
