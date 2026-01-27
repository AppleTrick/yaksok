package com.ssafy.yaksok.user.dto;

import com.ssafy.yaksok.disease.entity.Disease;
import com.ssafy.yaksok.product.dto.UserProductResponse;
import com.ssafy.yaksok.product.entity.ProductIngredient;
import com.ssafy.yaksok.user.enums.UserEnums;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class UserInfoResponse {

    private UserDataResponse userDataResponse;
    private List<Disease> userDiseases;
    private List<Disease> allDiseases;
    private List<UserProductResponse> userProducts;
}
