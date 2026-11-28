import { Pill } from "lucide-react";
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { List, ListItem } from '@astryxdesign/core/List';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Schedule, isItemDue } from "@/features/notification/contexts/ScheduleContext";

interface TimelineSectionProps {
    today: Date | null;
    schedules: Schedule[];
    onToggleItem: (scheduleId: string, itemId: string) => void;
}

const MEAL = { empty_stomach: '식전', post_meal: '식후', pre_sleep: '자기 전' } as const;

// 오늘 일정 전체. 눌러서 먹음/안 먹음을 바꾼다 (방향 A: 시각이 앞, 상태 배지가 뒤)
export default function TimelineSection({ today, schedules, onToggleItem }: TimelineSectionProps) {
    const rows = today ? schedules
        .filter((s) => s.isActive)
        .sort((a, b) => a.rawTime.localeCompare(b.rawTime))
        .flatMap((s) => s.items.filter((i) => isItemDue(i, today) && i.status !== 'stopped').map((item) => ({ s, item }))) : [];

    if (!rows.length) {
        return (
            <EmptyState icon={<Pill size={32} />} title="등록된 일정이 없어요" description="영양제를 찍어 등록하면 먹을 시간에 알려 드려요."
                actions={<Button variant="primary" label="영양제 찍기" href="/camera" />} />
        );
    }

    return (
        <VStack gap={2}>
            <HStack hAlign="between" vAlign="center"><Heading level={2}>오늘 일정</Heading><Text size="sm" color="secondary">눌러서 먹음 표시</Text></HStack>
            <Card padding={1}>
                <List hasDividers>
                    {rows.map(({ s, item }, idx) => (
                        <ListItem
                            key={`${item.id}-${idx}`}
                            onClick={() => onToggleItem(s.id, item.id)}
                            startContent={<Text className="hm-row-time" weight="bold" hasTabularNumbers color={item.isTaken ? 'secondary' : 'primary'}>{s.rawTime}</Text>}
                            label={<Text weight="semibold" maxLines={1} color={item.isTaken ? 'secondary' : 'primary'}>{item.name}</Text>}
                            description={`${MEAL[s.mealCategory] ?? ''}${item.detail ? ` · ${item.detail}` : ''}`}
                            endContent={<Badge variant={item.isTaken ? 'success' : 'neutral'} label={item.isTaken ? '✓ 먹음' : '예정'} />}
                        />
                    ))}
                </List>
            </Card>
        </VStack>
    );
}
