'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserX } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import SubPageHeader from '@/components/SubPageHeader';
import { changePassword } from '@/services/userService';
import { useUserInfo } from '@/services/useUserInfo';
import WithdrawalModal from './WithdrawalModal';
import '@/features/page.css';

export default function SecuritySettings() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // User info for withdrawal verification
    const userEmail = useUserInfo().userInfo?.userDataResponse.email ?? '';
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');


    const validatePassword = (password: string) => {
        const regex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
        return regex.test(password);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("모든 필드를 입력해 주세요.");
            return;
        }

        if (!validatePassword(newPassword)) {
            alert("새 비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        setSubmitting(true);
        const success = await changePassword(currentPassword, newPassword);
        if (success) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            alert("비밀번호 변경에 실패했습니다. 현재 비밀번호를 다시 확인해 주세요.");
        }
        setSubmitting(false);
    };

    const handleWithdrawalClick = () => {
        if (!userEmail) {
            alert("사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }
        setShowWithdrawModal(true);
    };

    return (
        <VStack className="pg lg-page" gap={5}>
            <SubPageHeader title="계정 및 보안" />

            <Card>
                <form onSubmit={handlePasswordChange}>
                    <VStack gap={4}>
                        <HStack gap={2} vAlign="center"><ShieldCheck size={20} color="var(--color-icon-accent)" aria-hidden="true" /><Heading level={2}>비밀번호 변경</Heading></HStack>
                        <TextInput label="현재 비밀번호" type="password" autoComplete="current-password" value={currentPassword} onChange={setCurrentPassword} />
                        <TextInput label="새 비밀번호" type="password" autoComplete="new-password" description="영문, 숫자, 특수문자 포함 8자 이상" value={newPassword} onChange={setNewPassword} />
                        <TextInput label="새 비밀번호 확인" type="password" autoComplete="new-password" value={confirmPassword} onChange={setConfirmPassword} />
                        <Button type="submit" variant="primary" width="100%" label="비밀번호 변경하기" isLoading={submitting} />
                    </VStack>
                </form>
            </Card>

            <Card>
                <VStack gap={3}>
                    <HStack gap={2} vAlign="center"><UserX size={20} color="var(--color-icon-error)" aria-hidden="true" /><Heading level={2}>회원 탈퇴</Heading></HStack>
                    <Text color="secondary" size="sm">계정을 삭제하면 모든 기록(복용 정보, 질환 정보 등)이 사라지며 복구할 수 없습니다.</Text>
                    <Button variant="destructive" width="100%" label="탈퇴하기" onClick={handleWithdrawalClick} isDisabled={submitting} />
                </VStack>
            </Card>

            {showWithdrawModal && <WithdrawalModal email={userEmail} onClose={() => setShowWithdrawModal(false)} />}
        </VStack>
    );
}
