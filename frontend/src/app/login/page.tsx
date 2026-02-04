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
            const { login } = await import('@/services/authService');
            const result = await login(data.email, data.password);

            if (result.success) {
                console.log('Login successful:', result);
                router.push('/');
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

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}
