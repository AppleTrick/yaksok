import React, { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import AuthShell from './AuthShell';

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
        if (password.length < 8) return setError('비밀번호는 8자 이상이어야 합니다.');
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return setError('비밀번호는 특수문자를 최소 1개 포함해야 합니다.');
        if (password !== confirmPassword) return setError('비밀번호가 일치하지 않습니다.');
        onSubmit(password);
    };

    return (
        <AuthShell title="비밀번호 재설정" subtitle="새로운 비밀번호를 설정해 주세요.">
            <form onSubmit={handleSubmit}>
                <VStack gap={4}>
                    <TextInput label="새 비밀번호" type="password" autoComplete="new-password" description="8자 이상, 특수문자 1개 이상" value={password} onChange={setPassword} size="lg" isRequired />
                    <TextInput label="새 비밀번호 확인" type="password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} size="lg" isRequired
                        status={error ? { type: 'error', message: error } : undefined} />
                    <Button type="submit" variant="primary" size="lg" width="100%" isLoading={isLoading} label="비밀번호 변경" />
                </VStack>
            </form>
        </AuthShell>
    );
}
