package com.ssafy.yaksok.user.enums;

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
}
