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
            // 1. 카카오 인가 코드(Code)를 이용해 카카오 서버에서 액세스 토큰을 받아와야 함.
            // 클라이언트(프론트)에서 직접 요청하거나, 백엔드에서 수행할 수 있음.
            // 현재 API 스펙은 프론트에서 토큰을 넘겨주는 방식이므로, 여기서 카카오 토큰 발급 API를 호출해야 한다고 가정.

            // [MOCK] 실제 카카오 API 호출 대신 가짜 토큰 생성
            console.log('카카오 코드로 토큰 교환 시도 (Mocking)...');
            const mockKakaoAccessToken = 'mock-kakao-access-token-from-code_' + code;

            // 2. 발급받은 카카오 토큰을 우리 백엔드 서버로 전송
            const response = await axios.post('/api/v1/auth/oauth/login', {
                provider: 'KAKAO',
                oauthToken: mockKakaoAccessToken
            });

            const result = response.data;

            if (result.success) {
                console.log('카카오 로그인 성공:', result.data);

                // 토큰 저장
                localStorage.setItem('accessToken', result.data.accessToken);
                localStorage.setItem('refreshToken', result.data.refreshToken);

                alert(`카카오 로그인 성공! 환영합니다, ${result.data.user.nickname}님.`);
                router.push('/');
            } else {
                throw new Error(result.error?.message || '카카오 로그인 실패');
            }

        } catch (error: any) {
            console.error('카카오 로그인 에러:', error);
            const message = error.response?.data?.error?.message || '카카오 로그인 중 오류가 발생했습니다.';
            alert(message);
        } finally {
            // URL 정리 (코드가 노출되지 않도록)
            router.replace('/login');
            setIsLoading(false);
        }
    };

    const handleLogin = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/v1/auth/login', data);
            const result = response.data;

            if (result.success) {
                console.log('로그인 성공:', result.data);
                // 토큰 저장
                localStorage.setItem('accessToken', result.data.accessToken);
                localStorage.setItem('refreshToken', result.data.refreshToken);

                // 홈으로 리다이렉트
                alert(`로그인 성공! 환영합니다, ${result.data.user.name}님.`);
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
