import { ReactNode } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import '@/features/page.css';

// 비밀번호 찾기 단계 3개가 같이 쓰는 틀
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
    return (
        <VStack className="pg-plain lg-page" gap={6}>
            <VStack gap={1} hAlign="center">
                <Heading level={1}>{title}</Heading>
                <Text color="secondary" justify="center">{subtitle}</Text>
            </VStack>
            {children}
            <VStack hAlign="center">
                <Button variant="ghost" href="/login" label="로그인으로 돌아가기" />
            </VStack>
        </VStack>
    );
}
