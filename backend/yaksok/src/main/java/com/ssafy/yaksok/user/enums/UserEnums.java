package com.ssafy.yaksok.user.enums;

import com.nimbusds.openid.connect.sdk.claims.Gender;

public final class UserEnums {

    private UserEnums() {}

    public enum UserRole {
        USER, ADMIN
    }

    public enum UserStatus {
        ACTIVE, DELETED
    }

    public enum OAuthProvider {
        KAKAO
    }

    public enum AgeGroup{
        TEN, TWENTY, THIRTY, FORTY, FIFTY, SIXTY, SEVENTY, EIGHTY, NINETY;

        public static AgeGroup from(String value) {
            return AgeGroup.valueOf(value.toUpperCase());
        }
    }

    public enum Gender{
        MALE, FEMALE;
        public static Gender from(String value) {
            return Gender.valueOf(value.toUpperCase());
        }
    }

}
