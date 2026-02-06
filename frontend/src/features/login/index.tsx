'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import LoginForm from './components/LoginForm';
import './styles.css';

export default function LoginFeature() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const kakaoCode = searchParams.get('code');
        if (kakaoCode) {
            console.log('Kakao Auth Code Detected:', kakaoCode);
            handleKakaoLogin(kakaoCode);
        }
    }, [searchParams]);

    // Kakao Auth Logic
    const handleKakaoLogin = async (code: string) => {
        setIsLoading(true);
        try {
            console.log('1. 카카오 인가 코드(code)를 백엔드로 전송합니다:', code);

            // 중요: 백엔드가 302 Redirect를 반환하므로 결과값(HTML)은 무시합니다.
            // 대신 에러가 안 나면 성공으로 간주하고, 쿠키가 세팅되었으므로 '내 정보'를 조회합니다.
            await axios.get('/api/v1/auth/oauth/login', {
                params: {
                    code: code,
                },
            });

            console.log('로그인 요청(Redirect) 완료, 사용자 정보 조회 시도...');

            // 2. 내 정보 조회 (쿠키 기반 인증)
            const userResponse = await axios.get('/api/v1/user/me');
            const userResult = userResponse.data;

            if (userResult.success) {
                console.log('로그인 성공:', userResult.data);
                const userName = userResult.data.name;

                localStorage.setItem('userName', userName);
                alert(`카카오 로그인 성공! 환영합니다, ${userName}님.`);
                router.push('/');
            } else {
                throw new Error(userResult.error?.message || '사용자 정보 조회 실패');
            }

        } catch (error: any) {
            console.error('카카오 로그인 에러:', error);
            const message = error.response?.data?.error?.message || '로그인 중 오류 발생';
            // 백엔드가 302 리다이렉트를 줄 때, axios가 에러가 아닌 200(Home HTML)으로 처리할 수 있음.
            // 위 로직은 그 경우를 성공으로 보고 user/me를 호출하므로 괜찮음.
            // 만약 4xx, 5xx 에러가 나면 여기로 옴.
            alert(message);
            router.replace('/login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/v1/auth/login', data, { withCredentials: true });
            const result = response.data;

            if (result.success) {
                console.log('로그인 성공:', result.data);

                // 토큰 및 사용자 이름 저장
                const userName = result.data.name;
                localStorage.setItem('userName', userName);

                // 홈으로 리다이렉트
                alert(`로그인 성공! 환영합니다, ${userName}님.`);
                router.push('/');
            } else {
                alert(`로그인 실패: ${result.error?.message || '알 수 없는 오류'}`);
            }
        } catch (error: any) {
            console.error('로그인 에러:', error);
            // Axios 에러 처리
            const message = error.response?.data?.error?.message || '로그인 중 오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return <LoginForm onSubmit={handleLogin} isLoading={isLoading} />;
}