package com.ssafy.yaksok.user.service;

import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public long authenticate(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_LOGIN_FAIL));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FAIL);
        }

        return user.getId();
    }

    public long kakaoAuthenticate(String kakaoId){
        User user = userRepository.findByOauthId(kakaoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_OAUTH_LOGIN_FAIL));

        return user.getId();
    }

    public String encodePassword(String password){
        return passwordEncoder.encode(password);
    }

    public boolean verifyPassword(User user, String password){
        return passwordEncoder.matches(password, user.getPassword());
    }



    //CRUD
    public void signup(User signupUser) {

        if (userRepository.existsByEmail(signupUser.getEmail())) {
            throw new BusinessException(ErrorCode.USER_DUPLICATE_EMAIL);
        }

        User user = User.createLocalUser(
                signupUser.getEmail(),
                passwordEncoder.encode(signupUser.getPassword()),
                signupUser.getName(),
                signupUser.getAgeGroup(),
                signupUser.getGender()
        );

        userRepository.save(user);
    }

    public void KakaoSignup(User signupUser) {

        if (userRepository.existsByOauthId(signupUser.getOauthId())) {
            throw new BusinessException(ErrorCode.USER_DUPLICATE_OUATHID);
        }

        userRepository.save(signupUser);
    }


    public void createOauthUser(User user){
        userRepository.save(user);
    }

    public User findByUserEmail(String email){
        return userRepository.findByEmail(email).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public User findByUserId(long userId){
        return userRepository.findById(userId).orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    public void updataUser(User user){
        userRepository.save(user);
    }

    public void deleteUser(long userId){
        userRepository.deleteById(userId);
    }
}
