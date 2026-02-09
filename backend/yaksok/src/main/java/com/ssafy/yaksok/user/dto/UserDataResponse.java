package com.ssafy.yaksok.user.dto;

import com.ssafy.yaksok.user.enums.UserEnums;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
public class UserDataResponse {
    private String email;
    private String name;
    private UserEnums.AgeGroup ageGroup;
    private UserEnums.Gender gender;

    @Builder
    public UserDataResponse(String email, String name, UserEnums.AgeGroup ageGroup, UserEnums.Gender gender) {
        this.email = email;
        this.name = name;
        this.ageGroup = ageGroup;
        this.gender = gender;
    }
}
