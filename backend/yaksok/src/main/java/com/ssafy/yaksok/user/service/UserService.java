package com.ssafy.yaksok.user.service;

import com.ssafy.yaksok.auth.dto.KakaoUserInfo;
import com.ssafy.yaksok.auth.dto.SignupRequest;
import com.ssafy.yaksok.global.exception.BusinessException;
import com.ssafy.yaksok.global.exception.ErrorCode;
import com.ssafy.yaksok.user.entity.User;
import com.ssafy.yaksok.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User authenticate(String email, String rawPassword) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FAIL);
        }

        return user;
    }

    public User kakaoAuthenticate(String kakaoId){
        return userRepository.findByOauthId(kakaoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_OAUTH_LOGIN_FAIL));
    }

    public String encodePassword(String password){
        return passwordEncoder.encode(password);
    }

    public boolean verifyPassword(User user, String password){
        return passwordEncoder.matches(password, user.getPassword());
    }

    public boolean existsEmail(String email){
        return userRepository.existsByEmail(email);
    }

    public boolean existsOauthId(String oauthId){
        return userRepository.existsByOauthId(oauthId);
    }

    //CRUD
    public void signUp(SignupRequest request){
        if(existsEmail(request.getEmail())){
            throw new BusinessException(ErrorCode.USER_DUPLICATE_EMAIL);
        }

        User user = User.createLocalUser(request.getEmail(),
                encodePassword(request.getPassword()), request.getName(), request.getName(), request.getGender());

        userRepository.save(user);
    }

    public void kakaoSignUp(KakaoUserInfo kakaoUserInfo){
        if(existsOauthId(kakaoUserInfo.getKakaoId())){
            throw new BusinessException(ErrorCode.USER_DUPLICATE_OUATHID);
        }

        User user = User.createKakaoUser(kakaoUserInfo.getEmail(),
                kakaoUserInfo.getNickname(), kakaoUserInfo.getKakaoId(), null, null);

        userRepository.save(user);
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
