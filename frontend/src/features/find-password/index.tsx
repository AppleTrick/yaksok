'use client';

import React, { useState } from 'react';
import axios from '@/lib/axios';
import FindPasswordForm from './components/FindPasswordForm';
import EmailSentMessage from './components/EmailSentMessage';
import './styles.css';

export default function FindPasswordFeature() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleFindPassword = async (submittedEmail: string) => {
        setIsLoading(true);
        setEmail(submittedEmail);

        try {
            const response = await axios.post('/api/v1/auth/password/reset', { email: submittedEmail });
            const result = response.data;

            if (result.success) {
                console.log('비밀번호 찾기 성공:', result);
                setIsSent(true);
            } else {
                alert(result.error?.message || '비밀번호 재설정 요청 실패');
            }
        } catch (error: any) {
            console.error('비밀번호 찾기 에러:', error);
            const message = error.response?.data?.error?.message || '오류가 발생했습니다.';
            alert(message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSent) {
        return <EmailSentMessage email={email} />;
    }

    return <FindPasswordForm onSubmit={handleFindPassword} isLoading={isLoading} />;
}
