package com.ssafy.yaksok.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SignupRequest {
    @NotBlank @Email @Size(max = 255)
    String email;
    @NotBlank @Size(min = 8, max = 72)   // bcrypt는 72바이트까지만 본다
    String password;
    @NotBlank @Size(max = 50)
    String name;
    @NotNull @Pattern(regexp = "(?i)TEN|TWENTY|THIRTY|FORTY|FIFTY|SIXTY|SEVENTY|EIGHTY|NINETY")
    String ageGroup;
    @NotNull @Pattern(regexp = "(?i)MALE|FEMALE")
    String gender;
}
