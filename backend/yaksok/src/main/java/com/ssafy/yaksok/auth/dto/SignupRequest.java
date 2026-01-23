package com.ssafy.yaksok.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
    String email;
    String password;
    String name;
    String ageGroup;
    String gender;
}
