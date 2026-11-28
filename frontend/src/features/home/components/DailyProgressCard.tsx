"use client";

import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';

interface DailyProgressProps {
    total: number;
    taken: number;
}

// 고리는 Astryx에 없어 직접 그린다. 색은 Astryx 토큰 (home.css .hm-ring)
const R = 54;
const C = 2 * Math.PI * R;

export default function DailyProgressCard({ total, taken }: DailyProgressProps) {
    const percent = total > 0 ? Math.round((taken / total) * 100) : 0;

    return (
        <Card className="hm-card">
            <HStack className="hm-progress" gap={4} vAlign="center" hAlign="between">
                <VStack gap={1}>
                    <Heading level={2}>오늘의 복용</Heading>
                    <Text color="secondary">오늘 예정된 {total}개 중</Text>
                    <Text size="2xl" weight="bold" color="accent">{taken}개를 드셨어요</Text>
                </VStack>
                <figure className="hm-ring" aria-label={`${percent}% 복용`}>
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                        <circle className="hm-ring-track" cx="60" cy="60" r={R} fill="none" strokeWidth="12" />
                        <circle className="hm-ring-bar" cx="60" cy="60" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={C} strokeDashoffset={C - (percent / 100) * C} />
                    </svg>
                    <Text size="xl" weight="bold" hasTabularNumbers>{percent}%</Text>
                </figure>
            </HStack>
        </Card>
    );
}
