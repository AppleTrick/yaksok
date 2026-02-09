'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import FindPasswordForm from './components/FindPasswordForm';
import VerifyCodeForm from './components/VerifyCodeForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import './styles.css';

type Step = 'EMAIL_INPUT' | 'VERIFY_CODE' | 'RESET_PASSWORD';

export default function FindPasswordFeature() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('EMAIL_INPUT');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 1단계: 이메일 입력 및 코드 발송 요청
    const handleFindPassword = async (submittedEmail: string) => {
        setIsLoading(true);
        setEmail(submittedEmail);
        try {
            const response = await axios.post('/api/v1/auth/password/reset', { email: submittedEmail });
            const result = response.data;
            if (result.success) {
                console.log('이메일 발송 성공:', result);
                alert('인증 코드가 이메일로 발송되었습니다.');
                setStep('VERIFY_CODE'); // 다음 단계로 이동
            } else {
                alert(result.error?.message || '이메일 발송 실패');
            }
        } catch (error: any) {
            console.error('이메일 발송 에러:', error);
            const message = error.response?.data?.error?.message || '오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    // 2단계: 인증 코드 검증
    const handleVerifyCode = async (code: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/v1/auth/password/reset/verify', { email, code });
            const result = response.data;
            if (result.success) {
                console.log('인증 성공:', result);
                alert('이메일 인증이 완료되었습니다. 새 비밀번호를 설정해주세요.');
                setStep('RESET_PASSWORD'); // 다음 단계로 이동
            } else {
                alert(result.error?.message || '인증 실패');
            }
        } catch (error: any) {
            console.error('인증 에러:', error);
            const message = error.response?.data?.error?.message || '오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    // 3단계: 새 비밀번호 설정
    const handleResetPassword = async (password: string) => {
        setIsLoading(true);
        try {
            const response = await axios.post('/api/v1/auth/password/reset/confirm', {
                email,
                newPassword: password
            });
            const result = response.data;
            if (result.success) {
                console.log('비밀번호 변경 성공:', result);
                alert('비밀번호가 성공적으로 변경되었습니다. 로그인 페이지로 이동합니다.');
                router.push('/login'); // 로그인 페이지로 이동
            } else {
                alert(result.error?.message || '비밀번호 변경 실패');
            }
        } catch (error: any) {
            console.error('비밀번호 변경 에러:', error);
            const message = error.response?.data?.error?.message || '오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {step === 'EMAIL_INPUT' && (
                <FindPasswordForm onSubmit={handleFindPassword} isLoading={isLoading} />
            )}
            {step === 'VERIFY_CODE' && (
                <VerifyCodeForm onSubmit={handleVerifyCode} isLoading={isLoading} email={email} />
            )}
            {step === 'RESET_PASSWORD' && (
                <ResetPasswordForm onSubmit={handleResetPassword} isLoading={isLoading} />
            )}
        </>
    );
}
