import React from 'react';
import { MailCheck } from 'lucide-react';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Button } from '@astryxdesign/core/Button';
import { VStack } from '@astryxdesign/core/VStack';
import '@/features/page.css';

interface EmailSentMessageProps {
    email: string;
}

export default function EmailSentMessage({ email }: EmailSentMessageProps) {
    return (
        <VStack className="pg-plain lg-page" gap={6} vAlign="center">
            <EmptyState
                icon={<MailCheck size={32} />}
                title="인증 메일을 보냈어요"
                description={`${email}로 보낸 메일을 확인해 비밀번호를 다시 설정해 주세요.`}
                actions={<Button variant="primary" label="로그인으로 돌아가기" href="/login" />}
            />
        </VStack>
    );
}
