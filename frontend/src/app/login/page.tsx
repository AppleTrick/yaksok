'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import LoginForm from '@/features/login/components/LoginForm';
import '@/features/login/styles.css';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        const kakaoCode = searchParams.get('code');
        if (kakaoCode) {
            console.log('Kakao Auth Code Detected:', kakaoCode);
            // TODO: Send this code to backend API
            // handleKakaoLogin(kakaoCode);

            // Clean up URL (remove code query param)
            // router.replace('/login'); 
        }
    }, [searchParams]);

    const handleLogin = async (data: any) => {
        setIsLoading(true);
        try {
            // authService uses axios internally
            const { login } = await import('@/services/authService');
            const result = await login(data.email, data.password);

            if (result.success) {
                console.log('Login successful:', result);
                // Force a hard refresh to update UI state (or use context if available)
                window.location.href = '/';
            } else {
                alert(result.error || '로그인에 실패했습니다.');
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
