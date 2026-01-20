import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import InputForm from '@/components/InputForm';
import '../styles.css';

interface FindPasswordFormProps {
    onSubmit: (email: string) => void;
    isLoading: boolean;
}

export default function FindPasswordForm({ onSubmit, isLoading }: FindPasswordFormProps) {
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(email);
    };

    return (
        <div className="find-password-container">
            <header className="find-password-header">
                <h1 className="find-password-title">비밀번호 찾기</h1>
                <p className="find-password-subtitle">가입한 이메일을 입력해 주세요</p>
            </header>

            <form className="find-password-form" onSubmit={handleSubmit}>
                <InputForm
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <Button type="submit" variant="primary" size="large" isLoading={isLoading}>
                    인증 메일 보내기
                </Button>
            </form>

            <div className="find-password-actions">
                <Link href="/login">
                    <span className="find-password-link">로그인으로 돌아가기</span>
                </Link>
            </div>
        </div>
    );
}
