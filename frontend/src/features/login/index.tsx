'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from '@/lib/axios';
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

    const handleKakaoLogin = async (code: string) => {
        setIsLoading(true);
        try {
            console.log('1. 카카오 인가 코드로 액세스 토큰 요청 중...');

            const kakaoTokenResponse = await axios.post(
                'https://kauth.kakao.com/oauth/token',
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY || '',
                    redirect_uri: process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || '',
                    code: code,
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                    },
                }
            );

            const kakaoAccessToken = kakaoTokenResponse.data.access_token;
            console.log('2. 카카오 액세스 토큰 발급 완료:', kakaoAccessToken);

            // 3. 발급받은 카카오 토큰을 우리 백엔드 서버로 전송 (Form Data 형식)
            console.log('3. 백엔드로 카카오 로그인 요청 중...');
            const response = await axios.post(
                '/api/v1/auth/oauth/login',
                new URLSearchParams({
                    token: kakaoAccessToken,
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            );

            const result = response.data;

            if (result.success) {
                console.log('카카오 로그인 성공:', result.data);

                // 토큰 및 사용자 이름 저장
                const userName = result.data.name;
                localStorage.setItem('userName', userName);

                alert(`카카오 로그인 성공! 환영합니다, ${userName}님.`);
                router.push('/');
            } else {
                throw new Error(result.error?.message || '카카오 로그인 실패');
            }

        } catch (error: any) {
            console.error('카카오 로그인 에러:', error);
            const message = error.response?.data?.error?.message || '카카오 로그인 중 오류가 발생했습니다.';
            alert(message);
        } finally {
            // URL 정리
            router.replace('/login');
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