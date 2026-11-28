'use client';

import { useCallback, useEffect, useState } from 'react';
import { Camera, Clock, CloudSun, Moon, Sun, Trash2 } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Badge } from '@astryxdesign/core/Badge';
import { Switch } from '@astryxdesign/core/Switch';
import { Button } from '@astryxdesign/core/Button';
import { Banner } from '@astryxdesign/core/Banner';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { TimeInput, type ISOTimeString } from '@astryxdesign/core/TimeInput';

// 서버 시각(HH:MM)을 TimeInput 값으로
const iso = (t: string) => t as ISOTimeString;
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { ToggleButton, ToggleButtonGroup } from '@astryxdesign/core/ToggleButton';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import PushStatus from './PushStatus';
import {
    Alarm, AlarmCategory, CATEGORY_LABEL, DAY_LABELS, deleteAlarm, describeDays, fetchAlarms, fetchQuietHours,
    formatTime, parseDays, QuietHours, runsToday, saveAlarm, saveQuietHours, toggleAlarm,
} from './api';
import '@/features/page.css';
import './alarms.css';

/** 다음 알림까지 남은 시간을 사람 말로 */
function until(hhmm: string, now: Date) {
    const [h, m] = hhmm.split(':').map(Number);
    const d = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
    if (d <= 0) return '곧';
    return d >= 60 ? `${Math.floor(d / 60)}시간${d % 60 ? ` ${d % 60}분` : ''} 뒤` : `${d}분 뒤`;
}

const SLOT = (t: string | null) => {
    const h = Number((t ?? '09').slice(0, 2));
    return h >= 18 ? { Icon: Moon, cls: 'night' } : h >= 12 ? { Icon: CloudSun, cls: 'lunch' } : { Icon: Sun, cls: 'morning' };
};

export default function AlarmsScreen() {
    const [alarms, setAlarms] = useState<Alarm[] | null>(null);
    const [quiet, setQuiet] = useState<QuietHours | null>(null);
    const [editing, setEditing] = useState<Alarm | null>(null);
    const [error, setError] = useState('');
    const [now, setNow] = useState<Date | null>(null);

    const load = useCallback(async () => {
        try {
            const [a, q] = await Promise.all([fetchAlarms(), fetchQuietHours()]);
            setAlarms(a);
            setQuiet(q);
            setNow(new Date());
            setError('');
        } catch {
            setError('알림을 불러오지 못했어요.');
        }
    }, []);

    useEffect(() => {
        const t = setTimeout(load, 0);
        return () => clearTimeout(t);
    }, [load]);

    // 저장한 뒤 서버 상태를 다시 읽는다. 화면만 바뀌고 저장은 안 되던 문제를 막는다.
    const run = async (action: () => Promise<unknown>) => {
        try {
            await action();
            await load();
        } catch {
            setError('저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
        }
    };

    const sorted = [...(alarms ?? [])].sort((a, b) => (a.intakeTime ?? '').localeCompare(b.intakeTime ?? ''));
    const next = now && sorted.find((a) => a.enabled && !a.intaken && a.intakeTime && runsToday(a, now)
        && a.intakeTime.slice(0, 5) > now.toTimeString().slice(0, 5));

    return (
        <VStack className="pg" gap={4} as="main">
            <VStack gap={0.5} as="header">
                <Text color="secondary">{now?.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }) ?? ' '}</Text>
                <Heading level={1}>알림</Heading>
            </VStack>

            {error && <Banner status="error" title={error} endContent={<Button size="sm" label="다시 시도" onClick={load} />} />}

            {next && now && (
                <Card className="al-next">
                    <VStack gap={1}>
                        <Text className="al-next-cd" weight="bold" color="inherit">{until(next.intakeTime!, now)}</Text>
                        <Text className="al-next-time" hasTabularNumbers color="inherit">{formatTime(next.intakeTime!)}</Text>
                        <Text className="al-next-who" color="inherit">{next.nickname} · {CATEGORY_LABEL[next.category]}</Text>
                    </VStack>
                </Card>
            )}

            <HStack gap={1.5} wrap="wrap">
                <PushStatus />
                {quiet?.enabled && <Badge variant="neutral" icon={<Moon size={12} />} label={`${(quiet.quietStart ?? '22:00').slice(0, 5)}–${(quiet.quietEnd ?? '07:00').slice(0, 5)} 조용히`} />}
            </HStack>

            <Heading level={2}>하루 일정</Heading>
            {alarms === null && !error && <Skeleton height={160} />}
            {alarms?.length === 0 && (
                <EmptyState title="아직 알림이 없어요" description="영양제를 찍어 등록하면 알림이 만들어져요."
                    actions={<Button variant="primary" icon={<Camera size={18} />} label="영양제 찍기" href="/camera" />} />
            )}
            {!!sorted.length && (
                <VStack gap={0} as="ol" className="al-rail">
                    {sorted.map((a, i) => {
                        const { Icon, cls } = SLOT(a.intakeTime);
                        return (
                            <HStack key={a.id} as="li" gap={3} vAlign="stretch" className={i === sorted.length - 1 ? 'last' : ''}>
                                <span className={`al-rail-icon ${cls}`} aria-hidden="true"><Icon size={19} /></span>
                                <ClickableCard className="al-card" label={`${a.nickname} 알림 수정`} onClick={() => setEditing(a)} padding={4}>
                                    <HStack hAlign="between" vAlign="center" gap={3}>
                                        <VStack gap={0.5}>
                                            <Text size="2xl" weight="bold" hasTabularNumbers color={a.enabled ? 'primary' : 'disabled'}>{a.intakeTime ? formatTime(a.intakeTime) : '시간 없음'}</Text>
                                            <Text size="sm" color="secondary" maxLines={1}>{a.nickname} · {describeDays(parseDays(a.daysOfWeek))} · {CATEGORY_LABEL[a.category]}{a.intaken ? ' · 오늘 먹음' : ''}</Text>
                                        </VStack>
                                        <Switch label={`${a.nickname} 알림`} isLabelHidden value={a.enabled} onChange={() => run(() => toggleAlarm(a.id))} />
                                    </HStack>
                                </ClickableCard>
                            </HStack>
                        );
                    })}
                </VStack>
            )}

            {quiet && (
                <>
                    <Heading level={2}>방해금지</Heading>
                    <Card>
                        <VStack gap={3}>
                            <Switch label="이 시간에는 울리지 않기" description="끝나면 밀린 알림을 한 번에 알려 드려요" labelIcon={<Moon size={18} />}
                                labelPosition="start" labelSpacing="spread" width="100%"
                                value={quiet.enabled} onChange={() => run(() => saveQuietHours({ ...quiet, enabled: !quiet.enabled }))} />
                            {quiet.enabled && (
                                <HStack gap={2} vAlign="end">
                                    <TimeInput label="시작" value={iso((quiet.quietStart ?? '22:00').slice(0, 5))}
                                        onChange={(v) => v && run(() => saveQuietHours({ ...quiet, quietStart: `${v.slice(0, 5)}:00` }))} />
                                    <TimeInput label="끝" value={iso((quiet.quietEnd ?? '07:00').slice(0, 5))}
                                        onChange={(v) => v && run(() => saveQuietHours({ ...quiet, quietEnd: `${v.slice(0, 5)}:00` }))} />
                                </HStack>
                            )}
                        </VStack>
                    </Card>
                </>
            )}
            <HStack gap={1} vAlign="center"><Clock size={14} aria-hidden="true" /><Text color="secondary" size="sm">안 드시면 10분 간격으로 세 번까지 알려 드려요.</Text></HStack>

            {editing && (
                <EditSheet alarm={editing} onClose={() => setEditing(null)}
                    onSave={(t, c, d) => { run(() => saveAlarm(editing, t, c, d)); setEditing(null); }}
                    onDelete={() => { run(() => deleteAlarm(editing.id)); setEditing(null); }} />
            )}
        </VStack>
    );
}

function EditSheet({ alarm, onClose, onSave, onDelete }: {
    alarm: Alarm;
    onClose: () => void;
    onSave: (time: string, category: AlarmCategory, days: number[]) => void;
    onDelete: () => void;
}) {
    const [time, setTime] = useState((alarm.intakeTime ?? '09:00').slice(0, 5));
    const [category, setCategory] = useState(alarm.category);
    const [days, setDays] = useState(parseDays(alarm.daysOfWeek));
    const [confirming, setConfirming] = useState(false);

    return (
        <BottomSheet isOpen onOpenChange={(open) => !open && onClose()} label="알림 수정" height="hug" purpose="form">
            <VStack gap={4} padding={4}>
                <Heading level={2} maxLines={2}>{alarm.nickname}</Heading>
                <TimeInput label="복용 시간" value={time ? iso(time) : undefined} onChange={(v) => setTime(v ? v.slice(0, 5) : '')} />
                <SegmentedControl label="먹는 때" layout="fill" value={category} onChange={(v) => setCategory(v as AlarmCategory)}>
                    {(Object.keys(CATEGORY_LABEL) as AlarmCategory[]).map((c) => <SegmentedControlItem key={c} value={c} label={CATEGORY_LABEL[c]} />)}
                </SegmentedControl>
                <VStack gap={1}>
                    <ToggleButtonGroup label="요일" type="multiple" value={days.map(String)} onChange={(v: string | string[] | null) => setDays(((v as string[]) ?? []).map(Number))}>
                        {DAY_LABELS.map((label, i) => <ToggleButton key={label} value={String(i + 1)} label={label} />)}
                    </ToggleButtonGroup>
                    <Text color={days.length ? 'secondary' : 'accent'} size="sm">{days.length ? describeDays(days) : '요일을 하나 이상 골라 주세요'}</Text>
                </VStack>
                <Button variant="primary" size="lg" width="100%" label="저장" isDisabled={!days.length || !time} onClick={() => onSave(time, category, days)} />
                <Button variant="ghost" size="lg" width="100%" icon={<Trash2 size={16} />} label="알림 지우기" onClick={() => setConfirming(true)} />
            </VStack>
            <AlertDialog isOpen={confirming} onOpenChange={setConfirming} title="알림을 지울까요?" description="지운 알림은 되돌릴 수 없어요."
                actionLabel="지우기" cancelLabel="취소" onAction={onDelete} />
        </BottomSheet>
    );
}
