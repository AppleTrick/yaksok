import React, { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import AuthShell from './AuthShell';

interface FindPasswordFormProps {
    onSubmit: (email: string) => void;
    isLoading: boolean;
}

export default function FindPasswordForm({ onSubmit, isLoading }: FindPasswordFormProps) {
    const [email, setEmail] = useState('');
    return (
        <AuthShell title="비밀번호 찾기" subtitle="가입한 이메일을 입력해 주세요">
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(email); }}>
                <VStack gap={4}>
                    <TextInput label="이메일" type="email" autoComplete="email" inputMode="email" placeholder="example@email.com" value={email} onChange={setEmail} size="lg" isRequired />
                    <Button type="submit" variant="primary" size="lg" width="100%" isLoading={isLoading} label="인증 메일 보내기" />
                </VStack>
            </form>
        </AuthShell>
    );
}
