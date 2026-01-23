import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import InputForm from '@/components/InputForm';
import '../styles.css';

interface ResetPasswordFormProps {
    onSubmit: (password: string) => void;
    isLoading: boolean;
}

export default function ResetPasswordForm({ onSubmit, isLoading }: ResetPasswordFormProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
        if (!specialCharRegex.test(password)) {
            setError('비밀번호는 특수문자를 최소 1개 포함해야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        onSubmit(password);
    };

    return (
        <div className="find-password-container">
            <header className="find-password-header">
                <h1 className="find-password-title">비밀번호 재설정</h1>
                <p className="find-password-subtitle">새로운 비밀번호를 설정해 주세요.</p>
            </header>

            <form className="find-password-form" onSubmit={handleSubmit}>
                <InputForm
                    label="새 비밀번호"
                    type="password"
                    placeholder="비밀번호 (8자 이상)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <InputForm
                    label="새 비밀번호 확인"
                    type="password"
                    placeholder="비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                {error && <p style={{ color: 'red', fontSize: '14px', marginTop: '-10px', marginBottom: '10px' }}>{error}</p>}

                <Button type="submit" variant="primary" size="large" isLoading={isLoading}>
                    비밀번호 변경
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
