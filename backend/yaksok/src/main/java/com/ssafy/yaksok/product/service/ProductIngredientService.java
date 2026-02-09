package com.ssafy.yaksok.product.service;

import com.ssafy.yaksok.product.dto.ProductIngredientResponse;
import com.ssafy.yaksok.product.repository.ProductIngredientRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@AllArgsConstructor
public class ProductIngredientService {

    private final ProductIngredientRepository productIngredientRepository;

    public List<ProductIngredientResponse>  findIngredientsByProductIds(List<Long> productIds){
        return productIngredientRepository.findIngredientsByProductIds(productIds);
    }
}
