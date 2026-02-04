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
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // 이메일 검사 (개발 편의를 위해 완화)
    const validateEmail = (val: string) => {
        if (!val) return '이메일을 입력해주세요.';
        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if (!emailRegex.test(val)) return '올바른 이메일 형식이 아닙니다. (예: user@example.com)';
        return '';
    };

    // 비밀번호 검사 (개발 편의를 위해 최소 1자 이상)
    const validatePassword = (val: string) => {
        if (!val) return '비밀번호를 입력해주세요.';
        if (val.length < 1) return '비밀번호를 입력해주세요.';
        return '';
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        // 입력 중일 때는 에러 메시지를 부드럽게 업데이트하거나 지움
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: validateEmail(value) }));
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: validatePassword(value) }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (emailError || passwordError) {
            setErrors({
                email: emailError,
                password: passwordError
            });
            return;
        }

        setErrors({});
        onSubmit({ email, password });
    };

    return (
        <div className="login-container">
            <header className="login-header">
                <h1 className="login-title">로그인</h1>
                <p className="login-subtitle">건강한 하루를 시작하세요</p>
            </header>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
                <InputForm
                    label="이메일"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={handleEmailChange}
                    error={errors.email}
                    required
                />
                <InputForm
                    label="비밀번호"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={handlePasswordChange}
                    error={errors.password}
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3C6.477 3 2 6.477 2 10.765c0 2.898 2.05 5.434 5.15 6.786-.233.864-.849 3.097-.971 3.558-.153.578.21.569.444.415.18-.119 2.87-1.95 4.02-2.738.98.136 1.988.204 3.003.204 5.523 0 10-3.477 10-7.765S17.523 3 12 3z" />
                    </svg>
                    <span>카카오 로그인</span>
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
