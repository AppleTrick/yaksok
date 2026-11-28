"use client";

import { Check, PartyPopper, Pill } from 'lucide-react';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Schedule, isItemDue } from '@/features/notification/contexts/ScheduleContext';

const MEAL = { empty_stomach: '식전', post_meal: '식후', pre_sleep: '자기 전' } as const;
const slotName = (h: number) => (h >= 18 ? '저녁' : h >= 12 ? '점심' : '아침');
const minutes = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

/** 지금 몇 분 지났는지, 몇 분 남았는지를 사람 말로 */
function relative(diff: number) {
    const a = Math.abs(diff);
    const text = a >= 60 ? `${Math.floor(a / 60)}시간${a % 60 ? ` ${a % 60}분` : ''}` : `${a}분`;
    if (a < 1) return '지금이에요';
    return diff > 0 ? `${text} 뒤` : `${text} 지났어요`;
}

// 홈의 주인공: 지금 먹을 차례 (방향 A)
export default function NowCard({ today, schedules, total, taken, onToggleItem }: {
    today: Date;
    schedules: Schedule[];
    total: number;
    taken: number;
    onToggleItem: (scheduleId: string, itemId: string) => void;
}) {
    const due = schedules
        .filter((s) => s.isActive)
        .map((s) => ({ s, items: s.items.filter((i) => isItemDue(i, today) && i.status !== 'stopped') }))
        .filter((x) => x.items.length)
        .sort((a, b) => a.s.rawTime.localeCompare(b.s.rawTime));
    const next = due.find((x) => x.items.some((i) => !i.isTaken));
    const percent = total ? taken / total : 0;

    if (!next) {
        return (
            <Card className="hm-now done">
                <VStack gap={2} hAlign="start">
                    <span className="hm-now-icon" aria-hidden="true"><PartyPopper size={22} /></span>
                    <Heading level={2}>오늘 약속을 다 지켰어요</Heading>
                    <Text color="secondary">{total ? `${total}개 모두 드셨어요. 내일 또 알려 드릴게요.` : '오늘은 먹을 약이 없어요.'}</Text>
                </VStack>
            </Card>
        );
    }

    const now = today.getHours() * 60 + today.getMinutes();
    const diff = minutes(next.s.rawTime) - now;
    const left = next.items.filter((i) => !i.isTaken);
    const hour = Number(next.s.rawTime.slice(0, 2));

    return (
        <Card className="hm-now">
            <VStack gap={4}>
                <HStack hAlign="between" vAlign="start" gap={3}>
                    <VStack gap={2} hAlign="start">
                        <Badge variant="orange" label={diff <= 0 ? '지금 먹을 차례' : '다음 차례'} />
                        <Text className="hm-now-time" hasTabularNumbers>{next.s.time}</Text>
                        <Text color="secondary" weight="semibold">{slotName(hour)} {MEAL[next.s.mealCategory] ?? ''} · {relative(diff)}</Text>
                    </VStack>
                    <figure className="hm-mini-ring" aria-label={`오늘 ${total}개 중 ${taken}개 먹음`}>
                        <svg viewBox="0 0 74 74" aria-hidden="true">
                            <circle className="hm-ring-track" cx="37" cy="37" r="31" fill="none" strokeWidth="8" />
                            <circle className="hm-ring-bar" cx="37" cy="37" r="31" fill="none" strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={194.8} strokeDashoffset={194.8 * (1 - percent)} />
                        </svg>
                        <Text weight="bold" hasTabularNumbers>{taken}/{total}</Text>
                    </figure>
                </HStack>

                <VStack gap={1.5}>
                    {next.items.map((item) => (
                        <HStack key={item.id} className={`hm-dose ${item.isTaken ? 'taken' : ''}`} gap={3} vAlign="center">
                            <span className="hm-thumb" aria-hidden="true">{item.isTaken ? <Check size={18} /> : <Pill size={18} />}</span>
                            <VStack gap={0}>
                                <Text weight="semibold" maxLines={1} hasStrikethrough={item.isTaken}>{item.name}</Text>
                                {item.detail && <Text size="sm" color="secondary">{item.detail}</Text>}
                            </VStack>
                        </HStack>
                    ))}
                </VStack>

                <Button variant="primary" size="lg" width="100%" icon={<Check size={20} />}
                    label={left.length > 1 ? `${left.length}개 모두 먹었어요` : '먹었어요'}
                    onClick={() => left.forEach((i) => onToggleItem(next.s.id, i.id))} />
            </VStack>
        </Card>
    );
}
