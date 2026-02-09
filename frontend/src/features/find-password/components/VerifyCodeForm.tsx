import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import InputForm from '@/components/InputForm';
import '../styles.css';

interface VerifyCodeFormProps {
    onSubmit: (code: string) => void;
    isLoading: boolean;
    email: string;
}

export default function VerifyCodeForm({ onSubmit, isLoading, email }: VerifyCodeFormProps) {
    const [code, setCode] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(code);
    };

    return (
        <div className="find-password-container">
            <header className="find-password-header">
                <h1 className="find-password-title">인증 코드 입력</h1>
                <p className="find-password-subtitle">
                    {email}로 전송된<br />인증 코드를 입력해 주세요.
                </p>
                <p className="find-password-hint">(테스트용 코드: 123456)</p>
            </header>

            <form className="find-password-form" onSubmit={handleSubmit}>
                <InputForm
                    label="인증 코드"
                    type="text"
                    placeholder="인증 코드 6자리"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                />

                <Button type="submit" variant="primary" size="large" isLoading={isLoading}>
                    확인
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
