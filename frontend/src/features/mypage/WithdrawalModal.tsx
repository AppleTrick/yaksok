'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Banner } from '@astryxdesign/core/Banner';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { login } from '@/services/authService';
import { withdrawUser } from '@/services/userService';
import { useRouter } from 'next/navigation';

interface Props {
    email: string;
    onClose: () => void;
}

export default function WithdrawalModal({ email, onClose }: Props) {
    const router = useRouter(); // Use App Router hook
    const [password, setPassword] = useState('');
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleWithdraw = async () => {
        if (!isConsentChecked) return;
        if (!password) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Verify password using login API
            const loginRes = await login(email, password);
            if (!loginRes.success) {
                alert("비밀번호가 일치하지 않습니다.");
                setIsLoading(false);
                return;
            }

            // 2. Perform withdrawal
            // withdrawUser now returns boolean
            const success = await withdrawUser();

            if (success) {
                alert("회원 탈퇴가 완료되었습니다.");
                // Force a hard refresh or move to login
                window.location.href = '/login';
            } else {
                alert("회원 탈퇴 처리 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen onOpenChange={(open) => !open && onClose()} width="min(420px, 100%)" purpose="required">
            <DialogHeader title="회원 탈퇴" onOpenChange={(open) => !open && onClose()} />
            <VStack gap={4} padding={4}>
                <Banner status="error" title="모든 복용 기록, 사용자 설정, 건강 정보가 바로 지워지고 되돌릴 수 없어요." />
                <CheckboxInput label="위 내용을 확인했고 탈퇴에 동의합니다." value={isConsentChecked} onChange={setIsConsentChecked} />
                <TextInput label="비밀번호" type="password" autoComplete="current-password" description="본인 확인을 위해 입력해 주세요" value={password} onChange={setPassword} />
                <HStack gap={2} hAlign="end">
                    <Button label="취소" onClick={onClose} />
                    <Button variant="destructive" label="탈퇴하기" onClick={handleWithdraw} isDisabled={!isConsentChecked || !password} isLoading={isLoading} />
                </HStack>
            </VStack>
        </Dialog>
    );
}
