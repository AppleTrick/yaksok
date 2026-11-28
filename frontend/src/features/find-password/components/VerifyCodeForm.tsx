import React, { useState } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import AuthShell from './AuthShell';

interface VerifyCodeFormProps {
    onSubmit: (code: string) => void;
    isLoading: boolean;
    email: string;
}

export default function VerifyCodeForm({ onSubmit, isLoading, email }: VerifyCodeFormProps) {
    const [code, setCode] = useState('');
    return (
        <AuthShell title="인증 코드 입력" subtitle={<>{email}로 보낸<br />인증 코드를 입력해 주세요.</>}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(code); }}>
                <VStack gap={4}>
                    <Text color="secondary" size="sm" justify="center">(테스트용 코드: 123456)</Text>
                    <TextInput label="인증 코드" inputMode="numeric" autoComplete="one-time-code" placeholder="인증 코드 6자리" value={code} onChange={setCode} size="lg" isRequired />
                    <Button type="submit" variant="primary" size="lg" width="100%" isLoading={isLoading} label="확인" />
                </VStack>
            </form>
        </AuthShell>
    );
}
