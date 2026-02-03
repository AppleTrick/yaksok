package com.ssafy.yaksok.notification.infrastructure.fcm.token;

import com.ssafy.yaksok.notification.enums.NotificationEnums;
import com.ssafy.yaksok.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.bind.Name;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserFcmToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long userId;

    @Column(name="token", nullable = false)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(name="platform")
    private NotificationEnums.Platform platform;

    @Column(name="active", nullable = false)
    private boolean active;

    @Column(name="created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name="updated_at")
    private LocalDateTime updatedAt;

    private UserFcmToken(long userId, String token, NotificationEnums.Platform platform){
        this.userId = userId;
        this.token = token;
        this.platform = platform;
        this.active = true;
        this.createdAt = LocalDateTime.now();
    }

    public static UserFcmToken createToken(
            long userId,
            String Token,
            NotificationEnums.Platform platform
    ){
        return new UserFcmToken(userId, Token, platform);
    }

    public void changeUpdateAt(LocalDateTime time){ this.updatedAt = time;}

    public void updateToken(String token) { this.token = token; }

    public void changeActive(boolean active) { this.active = active; }
}
