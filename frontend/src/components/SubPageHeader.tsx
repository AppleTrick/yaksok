"use client";

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { IconButton } from '@astryxdesign/core/IconButton';

// 설정 아래 화면들의 머리글: 뒤로 가기 + 제목
export default function SubPageHeader({ title }: { title: string }) {
    const router = useRouter();
    return (
        <HStack gap={2} vAlign="center" as="header">
            <IconButton label="뒤로" icon={<ChevronLeft size={22} />} variant="ghost" onClick={() => router.back()} />
            <Heading level={1}>{title}</Heading>
        </HStack>
    );
}
