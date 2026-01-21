import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import InputForm from '@/components/InputForm';
import '../styles.css';

interface LoginFormProps {
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

export default function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ email, password });
    };

    return (
        <div className="login-container">
            <header className="login-header">
                <h1 className="login-title">로그인</h1>
                <p className="login-subtitle">건강한 하루를 시작하세요</p>
            </header>

            <form className="login-form" onSubmit={handleSubmit}>
                <InputForm
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <InputForm
                    label="비밀번호"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <Button type="submit" variant="primary" size="large" isLoading={isLoading} style={{ marginTop: '1rem' }}>
                    로그인
                </Button>

                {/* Kakao Login */}
                <button
                    type="button"
                    className="kakao-login-btn"
                    onClick={() => {
                        const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI}&response_type=code`;
                        window.location.href = KAKAO_AUTH_URL;
                    }}
                >
                    <img src="/assets/images/kakao_login_large_wide.png" alt="카카오 로그인" />
                </button>
            </form>

            <div className="login-actions">
                <Link href="/find-password">
                    <span className="login-link">비밀번호 찾기</span>
                </Link>
                <Link href="/signup">
                    <span className="login-link">회원가입</span>
                </Link>
            </div>
        </div>
    );
}
