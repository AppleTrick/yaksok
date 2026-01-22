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

    const handleLogin = (data: any) => {
        setIsLoading(true);
        // Simulate login API call
        setTimeout(() => {
            setIsLoading(false);
            console.log('Login attempt', data);
            // Here you would handle successful login (e.g., redirect)
        }, 1500);
    };

    return <LoginForm onSubmit={handleLogin} isLoading={isLoading} />;
}
