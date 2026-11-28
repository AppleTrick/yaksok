import { Sun, Moon, Check, Pill, CloudSun } from "lucide-react";
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { List, ListItem } from '@astryxdesign/core/List';
import { Badge } from '@astryxdesign/core/Badge';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Schedule, isItemDue } from "@/features/notification/contexts/ScheduleContext";

interface TimelineSectionProps {
    today: Date | null;
    schedules: Schedule[];
    onToggleItem: (scheduleId: string, itemId: string) => void;
}

export default function TimelineSection({ today, schedules, onToggleItem }: TimelineSectionProps) {
    const activeSchedules = schedules.filter(s => s.isActive);

    if (!today || activeSchedules.length === 0) {
        return <EmptyState icon={<Pill size={32} />} title="등록된 일정이 없어요" description="영양제를 등록하고 건강한 습관을 시작해 보세요." />;
    }

    // Check if any schedule has due items to decide if we show "No schedule" message overall?
    // The original code rendered the map directly. If no items match isItemDue, it returned null.
    // If all return null, the container might be empty.

    const renderedSchedules = activeSchedules.map(schedule => {
        const dueItems = schedule.items.filter(item => isItemDue(item, today) && item.status !== 'stopped');
        if (dueItems.length === 0) return null;

        const hour = parseInt(schedule.rawTime.split(':')[0]);
        const isNight = hour >= 18;
        const isLunch = hour >= 12 && hour < 18;
        const SlotIcon = isNight ? Moon : (isLunch ? CloudSun : Sun);
        const slotClass = isNight ? 'night' : (isLunch ? 'lunch' : 'morning');
        const slotName = isNight ? '저녁' : (isLunch ? '점심' : '아침');

        return (
            <VStack key={schedule.id} gap={2} as="section">
                <HStack gap={2} vAlign="center">
                    <span className={`hm-slot-icon ${slotClass}`} aria-hidden="true"><SlotIcon size={18} /></span>
                    <Heading level={3}>{slotName}</Heading>
                    <Text color="secondary" size="sm">{schedule.time}</Text>
                </HStack>
                <Card padding={1}>
                    <List hasDividers>
                        {dueItems.map((item, idx) => (
                            // 눌러서 먹음/안 먹음을 바꾼다
                            <ListItem
                                key={`${item.id}-${idx}`}
                                label={<Text hasStrikethrough={item.isTaken} color={item.isTaken ? 'secondary' : 'primary'} weight="semibold" maxLines={1}>{item.name}</Text>}
                                description={item.detail || undefined}
                                onClick={() => onToggleItem(schedule.id, item.id)}
                                startContent={<span className={`hm-check ${item.isTaken ? 'on' : ''}`} aria-hidden="true">{item.isTaken ? <Check size={16} strokeWidth={3} /> : <Pill size={16} />}</span>}
                                endContent={<Badge variant={item.isTaken ? 'success' : 'orange'} label={item.isTaken ? '먹었어요' : '먹기'} />}
                            />
                        ))}
                    </List>
                </Card>
            </VStack>
        );
    });

    // Check if everything was null (no items due today)
    const hasAnyContent = renderedSchedules.some(s => s !== null);

    if (!hasAnyContent) {
        return <EmptyState icon={<Sun size={32} />} title="오늘 예정된 일정이 없어요" description="편안한 하루 보내세요." />;
    }

    return <VStack gap={5}>{renderedSchedules}</VStack>;
}
