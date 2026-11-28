'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { clearUserInfo } from '@/services/useUserInfo';
import axios from 'axios';
import LoginForm from './components/LoginForm';
import './styles.css';

const errorMessage = (error: unknown): string =>
    (axios.isAxiosError(error) && error.response?.data?.error?.message) || '로그인하지 못했어요. 잠시 뒤 다시 시도해 주세요.';

export default function LoginFeature() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const kakaoCode = useSearchParams().get('code');
    const usedCode = useRef<string | null>(null);
    const router = useRouter();

    // 로그인 쿠키는 서버가 심는다. 화면에는 이름만 남긴다.
    const run = useCallback(async (request: () => Promise<string>) => {
        setIsLoading(true);
        setError('');
        try {
            localStorage.setItem('userName', await request());
            clearUserInfo(); // 앞서 로그인한 사람의 정보가 남지 않게
            router.replace('/');
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setIsLoading(false);
        }
    }, [router]);

    useEffect(() => {
        // 카카오 인가 코드는 한 번만 쓸 수 있다
        if (!kakaoCode || usedCode.current === kakaoCode) return;
        usedCode.current = kakaoCode;
        run(async () => {
            await axios.get('/api/v1/auth/oauth/login', { params: { code: kakaoCode } });
            return (await axios.get('/api/v1/user/me')).data.data.name;
        });
    }, [kakaoCode, run]);

    return (
        <LoginForm
            isLoading={isLoading}
            error={error}
            onSubmit={(data) => run(async () => (await axios.post('/api/v1/auth/login', data)).data.data.name)}
        />
    );
}
