import React, { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Selector } from '@astryxdesign/core/Selector';
import { Banner } from '@astryxdesign/core/Banner';
import '@/features/page.css';

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
    const [choiceError, setChoiceError] = useState('');

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const handleEmailChange = (newEmail: string) => {
        setEmail(newEmail);
        if (newEmail && !validateEmail(newEmail)) {
            setEmailError('올바른 이메일 형식이 아닙니다.');
        } else {
            setEmailError('');
        }
    };

    const validatePassword = (password: string) => {
        // 영문, 숫자, 특수문자 포함 8자 이상
        const regex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
        return regex.test(password);
    };

    const handlePasswordChange = (newPassword: string) => {
        setPassword(newPassword);
        if (newPassword && !validatePassword(newPassword)) {
            setPasswordError('비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.');
        } else if (confirmPassword && newPassword !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        } else {
            setPasswordError('');
        }
    };

    const handleConfirmPasswordChange = (newConfirmPassword: string) => {
        setConfirmPassword(newConfirmPassword);
        if (password !== newConfirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
        } else {
            setPasswordError('');
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

        if (!validatePassword(password)) {
            setPasswordError('비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.');
            return;
        }

        if (password !== confirmPassword) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!gender || !ageGroup) {
            setChoiceError('성별과 연령대를 골라 주세요.');
            return;
        }
        setChoiceError('');

        onSubmit({ name, email, password, gender, ageGroup });
    };

    const ageGroups = ['10대', '20대', '30대', '40대', '50대', '60대+'];

    const err = (m: string) => (m ? { type: 'error' as const, message: m } : undefined);

    return (
        <VStack className="pg-plain lg-page" gap={6}>
            <VStack gap={1} hAlign="center">
                <Heading level={1}>회원가입</Heading>
                <Text color="secondary">새로운 건강 여정을 시작해 보세요</Text>
            </VStack>

            <form onSubmit={handleSubmit} noValidate>
                <VStack gap={4}>
                    <TextInput label="이름" placeholder="홍길동" autoComplete="name" value={name} onChange={setName} size="lg" />

                    <VStack gap={1}>
                        <Text type="label" weight="semibold">성별</Text>
                        <SegmentedControl label="성별" layout="fill" size="lg" value={gender} onChange={(v) => setGender(v as 'male' | 'female')}>
                            <SegmentedControlItem value="male" label="남성" />
                            <SegmentedControlItem value="female" label="여성" />
                        </SegmentedControl>
                    </VStack>

                    <Selector label="연령대" placeholder="연령대를 고르세요" options={ageGroups} value={ageGroup || undefined} onChange={(v) => setAgeGroup(v ?? '')} />

                    <TextInput label="이메일" type="email" autoComplete="email" inputMode="email" placeholder="example@email.com"
                        value={email} onChange={handleEmailChange} size="lg" status={err(emailError)} />
                    <TextInput label="비밀번호" type="password" autoComplete="new-password" description="영문, 숫자, 특수문자 포함 8자 이상"
                        value={password} onChange={handlePasswordChange} size="lg" />
                    <TextInput label="비밀번호 확인" type="password" autoComplete="new-password"
                        value={confirmPassword} onChange={handleConfirmPasswordChange} size="lg" status={err(passwordError)} />

                    {choiceError && <Banner status="error" title={choiceError} />}

                    <Button type="submit" variant="primary" size="lg" width="100%" isLoading={isLoading} label="가입하기" />
                </VStack>
            </form>

            <HStack gap={1} hAlign="center" vAlign="center">
                <Text color="secondary">이미 계정이 있으신가요?</Text>
                <Button variant="ghost" href="/login" label="로그인" />
            </HStack>
        </VStack>
    );
}
