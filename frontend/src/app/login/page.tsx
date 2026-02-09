'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '@/features/login/components/LoginForm';
import '@/features/login/styles.css';
import { useRouter } from 'next/navigation';

function LoginContent() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const kakaoCode = searchParams.get('code');
        if (kakaoCode) {
            console.log('Kakao Auth Code Detected:', kakaoCode);
        }
    }, [searchParams]);

    const handleLogin = async (data: any) => {
        setIsLoading(true);
        try {
            // const { login } = await import('@/services/authService');
            // const result = await login(data.email, data.password);

            // 임시 테스트 로그인 처리 (액세스 토큰 쿠키 발급용)
            const axios = (await import('axios')).default;
            const response = await axios.get('/api/v1/auth/test/login', { withCredentials: true });

            if (response.data.success) {
                console.log('Test login successful:', response.data);
                // 백엔드에서 받은 사용자 정보를 localStorage에 저장 (기존 페이지들의 로그인 상태 유지용)
                localStorage.setItem('userName', response.data.data.name);
                router.push('/');
            } else {
                alert('테스트 로그인에 실패했습니다.');
            }
        } catch (error: any) {
            console.error('Login error:', error);
            alert('로그인 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return <LoginForm onSubmit={handleLogin} isLoading={isLoading} />;
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
