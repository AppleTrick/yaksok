import React, { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import '@/features/page.css';
import '../styles.css';

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
const KAKAO_REDIRECT = process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI;

interface LoginFormProps {
    onSubmit: (data: { email: string; password: string }) => void;
    isLoading: boolean;
    error?: string;
}

export default function LoginForm({ onSubmit, isLoading, error }: LoginFormProps) {
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

    const handleEmailChange = (value: string) => {
        setEmail(value);
        // 입력 중일 때는 에러 메시지를 부드럽게 업데이트하거나 지움
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: validateEmail(value) }));
        }
    };

    const handlePasswordChange = (value: string) => {
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
        onSubmit({ email: email.trim(), password });
    };

    return (
        <VStack className="pg-plain lg-page" gap={6} vAlign="center">
            <VStack gap={1} hAlign="center">
                <Heading level={1} color="accent">약속</Heading>
                <Text color="secondary">건강한 하루를 시작하세요</Text>
            </VStack>

            <form onSubmit={handleSubmit} noValidate>
                <VStack gap={4}>
                    <TextInput label="이메일" type="email" autoComplete="email" inputMode="email" placeholder="이메일을 입력하세요"
                        value={email} onChange={handleEmailChange} size="lg"
                        status={errors.email ? { type: 'error', message: errors.email } : undefined} />
                    <TextInput label="비밀번호" type="password" autoComplete="current-password" placeholder="비밀번호를 입력하세요"
                        value={password} onChange={handlePasswordChange} size="lg"
                        status={errors.password ? { type: 'error', message: errors.password } : undefined} />

                    {error && <Banner status="error" title={error} />}

                    <Button type="submit" variant="primary" size="lg" width="100%" isLoading={isLoading} label="로그인" />

                {/* 카카오 설정이 없는 빌드에서는 동작하지 않는 버튼을 보이지 않는다 */}
                {KAKAO_KEY && KAKAO_REDIRECT && <button
                    type="button"
                    className="kakao-login-btn"
                    onClick={() => {
                        const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_KEY}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT)}&response_type=code`;
                        window.location.href = KAKAO_AUTH_URL;
                    }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3C6.477 3 2 6.477 2 10.765c0 2.898 2.05 5.434 5.15 6.786-.233.864-.849 3.097-.971 3.558-.153.578.21.569.444.415.18-.119 2.87-1.95 4.02-2.738.98.136 1.988.204 3.003.204 5.523 0 10-3.477 10-7.765S17.523 3 12 3z" />
                    </svg>
                    <span>카카오 로그인</span>
                </button>}
                </VStack>
            </form>

            <HStack hAlign="between">
                <Button variant="ghost" href="/find-password" label="비밀번호 찾기" />
                <Button variant="ghost" href="/signup" label="회원가입" />
            </HStack>
        </VStack>
    );
}
