'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Pill } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Card } from '@astryxdesign/core/Card';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Banner } from '@astryxdesign/core/Banner';
import { TimeInput, type ISOTimeString } from '@astryxdesign/core/TimeInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { List, ListItem } from '@astryxdesign/core/List';
import { useReportContext } from '@/features/report/contexts/ReportContext';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { Ingredient, ScanError, register } from '@/features/scan/types';
import '@/features/page.css';
import '@/features/report/report.css';

const CATEGORIES = [
    { value: 'BEFOREMEAL', label: '식전' },
    { value: 'AFTERMEAL', label: '식후' },
    { value: 'BEFORESLEEP', label: '자기 전' },
];

const num = (v?: string) => Number(v ?? 0) || 0;
const fmt = (v: number) => (Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2).replace(/\.?0+$/, ''));

/**
 * 영양제 리포트 (예전 흐름의 4단계). 성분별 섭취량을 보여 주고 한 번에 등록한다.
 * 상한을 넘는 성분이 있으면 등록하지 않고 경고한다 (예전 동작 그대로).
 */
export default function ReportPage() {
    const router = useRouter();
    const { reportData, clearReportData } = useReportContext();
    const { refreshSchedules } = useScheduleContext();
    const items = reportData.items;
    const [tab, setTab] = useState(0);
    const [times, setTimes] = useState(() => items.map((x) => ({
        time: x.intakeTime?.slice(0, 5) ?? '09:00',
        category: x.intakeCategory ?? 'AFTERMEAL',
    })));
    const [busy, setBusy] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [warning, setWarning] = useState<string[] | null>(null);
    const [done, setDone] = useState<number | null>(null);
    const leaving = useRef(false);

    useEffect(() => {
        if (!items.length && !leaving.current) router.replace('/camera');
    }, [items.length, router]);
    if (!items.length) return null;

    const all = items.flatMap((x) => x.ingredients);
    const warned = [...new Set(all.filter((g) => g.status === 'warning').map((g) => g.name))];
    const registrable = items.filter((x) => x.productId !== null);
    const item = items[tab];

    const leave = (to: string) => {
        leaving.current = true;
        clearReportData();
        router.push(to);
    };

    const registerAll = async () => {
        if (warned.length) {
            setWarning(warned);
            return;
        }
        setBusy(true);
        const failed: string[] = [];
        let ok = 0;
        for (const [i, x] of items.entries()) {
            if (x.productId === null) continue;
            try {
                await register(x, times[i].time, times[i].category);
                ok += 1;
            } catch (e) {
                failed.push(e instanceof ScanError ? e.message : `${x.name}: 등록하지 못했어요.`);
            }
        }
        setBusy(false);
        setErrors(failed);
        if (ok) {
            await refreshSchedules();
            setDone(ok);
        }
    };

    const setTime = (patch: Partial<{ time: string; category: string }>) =>
        setTimes((v) => v.map((t, i) => (i === tab ? { ...t, ...patch } : t)));

    return (
        <VStack className="pg-plain rp-page" gap={4}>
            <HStack gap={2} vAlign="center" as="header">
                <IconButton variant="ghost" label="다시 찍기" icon={<ArrowLeft size={22} />} onClick={() => leave('/camera')} />
                <Heading level={1}>영양제 리포트</Heading>
            </HStack>

            {/* 결론부터: 안전한지 한 문장 (신호등) */}
            <Card className={`rp-verdict ${warned.length ? 'warn' : 'ok'}`}>
                <VStack gap={2}>
                    <HStack gap={1} className="rp-lamp" aria-hidden="true"><i className="on" /><i className={warned.length ? 'on' : ''} /><i /></HStack>
                    <Heading level={2}>
                        {warned.length ? `${warned.join(', ')} 성분이 하루 상한을 넘어요` : '모든 성분이 하루 상한 안이에요'}
                    </Heading>
                    <Text color="secondary">
                        {warned.length ? '지금 드시는 영양제와 합친 양이에요. 등록 전에 양을 조절해 주세요.' : `영양제 ${items.length}개, 성분 ${all.length}개를 지금 드시는 것과 합쳐 봤어요.`}
                    </Text>
                </VStack>
            </Card>

            {items.length > 1 && (
                <SegmentedControl label="영양제" value={String(tab)} onChange={(v) => setTab(Number(v))}>
                    {items.map((x, i) => <SegmentedControlItem key={x.name} value={String(i)} label={x.name} />)}
                </SegmentedControl>
            )}

            <Card>
                <VStack gap={4}>
                    <HStack gap={3} vAlign="center">
                        <span className="rp-icon" aria-hidden="true"><Pill size={22} /></span>
                        <VStack gap={0.5}>
                            <Heading level={2}>{item.name}</Heading>
                            <Text color="secondary" size="sm">{item.productId === null ? 'DB에 없는 제품이라 등록할 수 없어요' : `성분 ${item.ingredients.length}개`}</Text>
                        </VStack>
                    </HStack>

                    <HStack hAlign="between" vAlign="center"><Heading level={3}>성분 {item.ingredients.length}개</Heading><Text size="sm" color="secondary">세로 선 = 하루 상한</Text></HStack>
                    {item.ingredients.length ? (
                        <VStack gap={4} as="ul" className="rp-ings">{item.ingredients.map((g) => <IngredientRow key={g.name} g={g} />)}</VStack>
                    ) : (
                        <Text color="secondary" size="sm">이 제품의 성분 정보가 아직 없어요. 추측해서 채우지 않아요.</Text>
                    )}

                    {item.productId !== null && (
                        <VStack gap={3}>
                            <HStack gap={1} vAlign="center"><Clock size={16} aria-hidden="true" /><Heading level={3}>복용 알림</Heading></HStack>
                            <TimeInput label="복용 시간" value={times[tab].time as ISOTimeString} onChange={(v) => setTime({ time: v ? v.slice(0, 5) : '' })} />
                            <SegmentedControl label="먹는 때" layout="fill" value={times[tab].category} onChange={(v) => setTime({ category: v })}>
                                {CATEGORIES.map((c) => <SegmentedControlItem key={c.value} value={c.value} label={c.label} />)}
                            </SegmentedControl>
                            {!items[tab].intakeTime && <Text color="secondary" size="sm">추천 시간이 없어 기본값을 넣었어요. 바꿔도 돼요.</Text>}
                        </VStack>
                    )}
                </VStack>
            </Card>

            {errors.length > 0 && <Banner status="error" title="일부를 등록하지 못했어요" description={errors.join(' / ')} />}

            <div className="rp-bottom">
                <Button className="rp-btn" variant="primary" size="lg" width="100%" isLoading={busy}
                    isDisabled={!registrable.length || times.some((t) => !t.time)} onClick={registerAll}
                    label={registrable.length ? `${registrable.length}개 영양제 등록하기` : '등록할 수 있는 영양제가 없어요'} />
            </div>

            <Dialog isOpen={done !== null} onOpenChange={() => leave('/my-supplements')} width="min(400px, 100%)" purpose="required">
                <DialogHeader title="등록 완료" />
                <VStack gap={4} padding={4}>
                    <Text>영양제 {done}개를 등록했어요. 복용 시간에 알려 드릴게요.</Text>
                    <Button variant="primary" width="100%" label="내 영양제 보기" onClick={() => leave('/my-supplements')} />
                </VStack>
            </Dialog>

            <Dialog isOpen={warning !== null} onOpenChange={(open) => !open && setWarning(null)} width="min(400px, 100%)">
                <DialogHeader title="섭취량 주의" onOpenChange={(open) => !open && setWarning(null)} />
                <VStack gap={3} padding={4}>
                    <Banner status="warning" title="지금 드시는 영양제와 합치면 아래 성분이 상한 섭취량을 넘어요." />
                    <List hasDividers>{warning?.map((n) => <ListItem key={n} label={n} />)}</List>
                    <Text color="secondary" size="sm">과다 섭취는 부작용이 생길 수 있어요. 섭취량을 조절해 주세요.</Text>
                    <HStack gap={2} hAlign="end">
                        <Button label="닫기" onClick={() => setWarning(null)} />
                        <Button variant="primary" label="다시 찍기" onClick={() => leave('/camera')} />
                    </HStack>
                </VStack>
            </Dialog>
        </VStack>
    );
}

/** 이미 먹는 양과 이번에 더해지는 양을 한 막대로 보여 준다 */
function IngredientRow({ g }: { g: Ingredient }) {
    const mine = num(g.myAmount);
    const add = num(g.amount);
    const max = g.maxAmount ? num(g.maxAmount) : 0;
    // 막대 눈금: 합친 양과 상한 중 큰 쪽이 막대의 85%가 되게
    const scale = Math.max(mine + add, max) / 0.85 || 1;
    const pct = (v: number) => `${Math.min(100, (v / scale) * 100)}%`;
    const label = g.status === 'warning' ? '상한 넘음' : g.status === 'unknown' ? '상한 정보 없음' : '안전';
    return (
        <li className={g.status}>
            <HStack hAlign="between" vAlign="center" gap={2}>
                <Text weight="semibold">{g.name}</Text>
                <Badge variant={g.status === 'warning' ? 'warning' : g.status === 'unknown' ? 'neutral' : 'success'} label={label} />
            </HStack>
            <div className="rp-bar" aria-hidden>
                <i className="mine" style={{ width: pct(mine) }} />
                <i className="add" style={{ left: pct(mine), width: pct(add) }} />
                {max > 0 && <b className="limit" style={{ left: pct(max) }} />}
            </div>
            <Text color="secondary" size="sm" hasTabularNumbers>
                {mine > 0 && <>지금 {fmt(mine)} + </>}이 제품 {fmt(add)} = <Text weight="bold" color="primary" size="sm">{fmt(mine + add)} {g.unit}</Text>
                {max > 0 && <> · 상한 {fmt(max)} {g.unit}</>}
            </Text>
        </li>
    );
}
