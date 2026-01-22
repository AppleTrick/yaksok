import React, { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import InputForm from '@/components/InputForm';
import '../styles.css';

interface SignupFormProps {
    onSubmit: (data: any) => void;
    isLoading: boolean;
}

export default function SignupForm({ onSubmit, isLoading }: SignupFormProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | ''>('');
    const [ageGroup, setAgeGroup] = useState<string>('');
    const [passwordError, setPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        if (newEmail && !validateEmail(newEmail)) {
            setEmailError('올바른 이메일 형식이 아닙니다.');
        } else {
            setEmailError('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setEmailError('');

        if (!validateEmail(email)) {
            setEmailError('올바른 이메일 형식이 아닙니다.');
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!gender || !ageGroup) {
            alert('성별과 연령대를 선택해주세요.');
            return;
        }

        onSubmit({ name, email, password, gender, ageGroup });
    };

    const ageGroups = ['10대', '20대', '30대', '40대', '50대', '60대+'];

    return (
        <div className="signup-container">
            <header className="signup-header">
                <h1 className="signup-title">회원가입</h1>
                <p className="signup-subtitle">새로운 건강 여정을 시작해보세요</p>
            </header>

            <form className="signup-form" onSubmit={handleSubmit}>
                <InputForm
                    label="이름"
                    type="text"
                    placeholder="홍길동"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                {/* Gender Selection */}
                <div className="label-group">
                    <span className="label-text">성별</span>
                    <div className="selection-group">
                        <button
                            type="button"
                            className={`selection-btn ${gender === 'male' ? 'active' : ''}`}
                            onClick={() => setGender('male')}
                        >
                            남성
                        </button>
                        <button
                            type="button"
                            className={`selection-btn ${gender === 'female' ? 'active' : ''}`}
                            onClick={() => setGender('female')}
                        >
                            여성
                        </button>
                    </div>
                </div>

                {/* Age Group Selection */}
                <div className="label-group">
                    <span className="label-text">연령대</span>
                    <div className="selection-group">
                        {ageGroups.map((age) => (
                            <button
                                key={age}
                                type="button"
                                className={`selection-btn ${ageGroup === age ? 'active' : ''}`}
                                onClick={() => setAgeGroup(age)}
                                style={{ flex: '1 1 30%' }}
                            >
                                {age}
                            </button>
                        ))}
                    </div>
                </div>

                <InputForm
                    label="이메일"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={handleEmailChange}
                    error={emailError}
                    required
                />
                <InputForm
                    label="비밀번호"
                    type="password"
                    placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <InputForm
                    label="비밀번호 확인"
                    type="password"
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={passwordError}
                    required
                />

                <Button type="submit" variant="primary" size="large" isLoading={isLoading} style={{ marginTop: '1rem' }}>
                    가입하기
                </Button>
            </form>

            <div className="signup-actions">
                <span className="signup-text">이미 계정이 있으신가요?</span>
                <Link href="/login">
                    <span className="signup-link">로그인</span>
                </Link>
            </div>
        </div>
    );
}
