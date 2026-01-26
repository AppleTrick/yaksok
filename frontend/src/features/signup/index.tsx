'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import SignupForm from './components/SignupForm';
import './styles.css';

export default function SignupFeature() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/v1/auth/signup', data);
            const result = response.data;

            if (result.success) {
                console.log('회원가입 성공:', result.data);
                alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                router.push('/login');
            } else {
                throw new Error(result.error?.message || '회원가입 실패');
            }
        } catch (error: any) {
            console.error('회원가입 에러:', error);
            const message = error.response?.data?.error?.message || '회원가입 중 오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return <SignupForm onSubmit={handleSignup} isLoading={isLoading} />;
}
