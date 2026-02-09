package com.ssafy.yaksok.user.dto;

import lombok.Data;
import java.util.List;

/**
 * 유저 정보 수정 요청 DTO
 */
@Data
public class UpdateUserRequest {
    private String name;           // 닉네임
    private String ageGroup;       // "TEN", "TWENTY", "THIRTY", ...
    private String gender;         // "MALE", "FEMALE"
    private List<Long> diseaseIds; // 질병 ID 목록
}