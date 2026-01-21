package com.ssafy.yaksok.user.repository;

import com.ssafy.yaksok.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    Optional<User> findByOauthId(String oauthId);
    boolean existsByEmail(String email);
    boolean existsByOauthId(String oauthId);
}
