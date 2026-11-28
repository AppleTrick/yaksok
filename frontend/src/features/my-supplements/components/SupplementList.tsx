import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CloudSun, Moon, Pill, Plus, Sun } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Text } from '@astryxdesign/core/Text';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Button } from '@astryxdesign/core/Button';
import { Spinner } from '@astryxdesign/core/Spinner';
import { MedicationItem } from '@/features/notification/types';

interface SupplementListProps {
    items: MedicationItem[];
    onItemClick: (item: MedicationItem) => void;
    onAddClick: () => void;
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    timeOf?: (item: MedicationItem) => string | null; // "09:00"
}

// 카드 그림 색: 이름으로 고정해 매번 같은 색이 나오게
const TONES = ['orange', 'blue', 'yellow', 'green', 'purple', 'pink'];
const toneOf = (name: string) => TONES[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
const slot = (t: string) => { const h = Number(t.slice(0, 2)); return h >= 18 ? { Icon: Moon, label: '저녁' } : h >= 12 ? { Icon: CloudSun, label: '점심' } : { Icon: Sun, label: '아침' }; };

type TabType = 'taking' | 'stopped';

const ITEMS_PER_PAGE = 10;

export default function SupplementList({ items, onItemClick, onAddClick, activeTab, onTabChange, timeOf }: SupplementListProps) {
    const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

    const filteredItems = useMemo(() => items.filter((item) => (item.status || 'taking') === activeTab), [items, activeTab]);
    const displayedItems = useMemo(() => filteredItems.slice(0, displayLimit), [filteredItems, displayLimit]);
    const hasMore = displayedItems.length < filteredItems.length;

    // 끝까지 내리면 10개씩 더 보여 준다
    const observerTarget = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) setDisplayLimit((prev) => prev + ITEMS_PER_PAGE);
        }, { threshold: 1.0 });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore]);

    const changeTab = (tab: TabType) => {
        setDisplayLimit(ITEMS_PER_PAGE);
        onTabChange(tab);
    };

    return (
        <VStack gap={4}>
            <SegmentedControl label="복용 상태" layout="fill" value={activeTab} onChange={(v) => changeTab(v as TabType)}>
                <SegmentedControlItem value="taking" label={`복용 중 ${items.filter((i) => (i.status || 'taking') === 'taking').length}`} />
                <SegmentedControlItem value="stopped" label={`쉬는 중 ${items.filter((i) => i.status === 'stopped').length}`} />
            </SegmentedControl>

            {displayedItems.length > 0 ? (
                // 내 약장: 2열 카드. 언제 먹는지를 카드에 바로 보여 준다
                <div className="ms-grid">
                    {displayedItems.map((item) => {
                        const t = timeOf?.(item);
                        const s = t ? slot(t) : null;
                        return (
                            <ClickableCard key={item.id} className="ms-card" label={`${item.nickname || item.name} 자세히`} onClick={() => onItemClick(item)} padding={4} elevation="low">
                                <VStack gap={3} hAlign="start">
                                    <span className={`ms-art ${toneOf(item.name)}`} aria-hidden="true"><Pill size={24} /></span>
                                    <Text weight="bold" maxLines={2}>{item.nickname || item.name}</Text>
                                    {s && <HStack gap={1} vAlign="center" className="ms-when"><s.Icon size={14} aria-hidden="true" /><Text size="sm" color="secondary" weight="semibold">{s.label} {t}</Text></HStack>}
                                </VStack>
                            </ClickableCard>
                        );
                    })}
                    {activeTab === 'taking' && (
                        <ClickableCard className="ms-card ms-add" label="영양제 추가" onClick={onAddClick} padding={4} variant="transparent">
                            <VStack gap={1} hAlign="center" vAlign="center"><Plus size={22} aria-hidden="true" /><Text weight="semibold" color="secondary">직접 추가</Text></VStack>
                        </ClickableCard>
                    )}
                </div>
            ) : activeTab === 'taking' ? (
                <EmptyState icon={<Pill size={32} />} title="어떤 영양제를 드시고 계신가요?" description="매일 챙겨 먹는 영양제를 기록해 보세요."
                    actions={<Button variant="primary" icon={<Plus size={18} />} label="영양제 등록하기" onClick={onAddClick} />} />
            ) : (
                <EmptyState title="아직 중단한 영양제가 없어요" description="꾸준히 잘 챙겨 드시고 계신가 봐요!"
                    actions={<Button label="복용 중인 영양제 보기" onClick={() => changeTab('taking')} />} />
            )}

            {hasMore && <div ref={observerTarget} className="ms-more"><Spinner /></div>}

        </VStack>
    );
}
