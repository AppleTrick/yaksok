import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, Pill, Plus } from 'lucide-react';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { List, ListItem } from '@astryxdesign/core/List';
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
}

type TabType = 'taking' | 'stopped';

const ITEMS_PER_PAGE = 10;

export default function SupplementList({ items, onItemClick, onAddClick, activeTab, onTabChange }: SupplementListProps) {
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
                <SegmentedControlItem value="taking" label="복용 중" />
                <SegmentedControlItem value="stopped" label="복용 중단" />
            </SegmentedControl>

            {displayedItems.length > 0 ? (
                <Card padding={1}>
                    <List hasDividers>
                        {displayedItems.map((item) => (
                            <ListItem
                                key={item.id}
                                label={item.nickname || item.name}
                                startContent={<span className="ms-icon" aria-hidden="true"><Pill size={18} /></span>}
                                endContent={<ChevronRight size={18} aria-hidden="true" />}
                                onClick={() => onItemClick(item)}
                            />
                        ))}
                    </List>
                </Card>
            ) : activeTab === 'taking' ? (
                <EmptyState icon={<Pill size={32} />} title="어떤 영양제를 드시고 계신가요?" description="매일 챙겨 먹는 영양제를 기록해 보세요."
                    actions={<Button variant="primary" icon={<Plus size={18} />} label="영양제 등록하기" onClick={onAddClick} />} />
            ) : (
                <EmptyState title="아직 중단한 영양제가 없어요" description="꾸준히 잘 챙겨 드시고 계신가 봐요!"
                    actions={<Button label="복용 중인 영양제 보기" onClick={() => changeTab('taking')} />} />
            )}

            {hasMore && <div ref={observerTarget} className="ms-more"><Spinner /></div>}

            {/* 떠 있는 추가 버튼: 앱 기둥 안, 탭바 위 */}
            <Button className="ms-fab" variant="primary" size="lg" elevation="high" isIconOnly icon={<Plus size={24} />} label="영양제 직접 등록" onClick={onAddClick} />
        </VStack>
    );
}
