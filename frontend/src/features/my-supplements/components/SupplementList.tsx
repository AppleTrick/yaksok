import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MedicationItem } from '@/features/notification/types';
import MySupplementCard from './MySupplementCard';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import '../styles.css';

interface SupplementListProps {
    items: MedicationItem[];
    onItemClick: (item: MedicationItem) => void;
    onAddClick: () => void;
}

type TabType = 'taking' | 'stopped';

const ITEMS_PER_PAGE = 10;

export default function SupplementList({ items, onItemClick, onAddClick }: SupplementListProps) {
    const [activeTab, setActiveTab] = useState<TabType>('taking');
    const [displayLimit, setDisplayLimit] = useState(ITEMS_PER_PAGE);

    // 1. Filter items based on active tab
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const status = item.status || 'taking'; // Default to taking
            return status === activeTab;
        });
    }, [items, activeTab]);

    // 2. Pagination (Infinite Scroll)
    const displayedItems = useMemo(() => {
        return filteredItems.slice(0, displayLimit);
    }, [filteredItems, displayLimit]);

    const hasMore = displayedItems.length < filteredItems.length;

    // 3. Observer for infinite scroll
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setDisplayLimit(prev => prev + ITEMS_PER_PAGE);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore]);

    // Reset pagination when tab changes
    useEffect(() => {
        setDisplayLimit(ITEMS_PER_PAGE);
    }, [activeTab]);

    return (
        <div className="supplement-list-container">
            {/* Tabs */}
            <div className="status-tabs">
                <button
                    className={`status-tab ${activeTab === 'taking' ? 'active' : ''}`}
                    onClick={() => setActiveTab('taking')}
                >
                    복용 중
                </button>
                <button
                    className={`status-tab ${activeTab === 'stopped' ? 'active' : ''}`}
                    onClick={() => setActiveTab('stopped')}
                >
                    복용 중단
                </button>
            </div>

            {/* List */}
            <div className="list-content">
                {displayedItems.length > 0 ? (
                    displayedItems.map((item) => (
                        <MySupplementCard
                            key={item.id}
                            item={item}
                            onClick={onItemClick}
                        />
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="empty-state-animated"
                    >
                        <div className="floating-icon-wrapper">
                            <span className="floating-icon">💊</span>
                        </div>
                        <div className="empty-content-wrapper">
                            <div className="empty-text-group">
                                <h3 className="empty-main-text">
                                    {activeTab === 'taking'
                                        ? '어떤 영양제를 드시고 계신가요?'
                                        : '아직 중단한 영양제가 없네요'}
                                </h3>
                                <p className="empty-sub-text">
                                    {activeTab === 'taking'
                                        ? '매일 챙겨 먹는 영양제를 기록해 보세요.'
                                        : '꾸준히 잘 챙겨 드시고 계신가 봐요!'}
                                </p>
                            </div>

                            {activeTab === 'taking' ? (
                                <button className="empty-cta-btn primary" onClick={onAddClick}>
                                    <Plus size={18} />
                                    <span>영양제 등록하기</span>
                                </button>
                            ) : (
                                <button
                                    className="empty-cta-link"
                                    onClick={() => setActiveTab('taking')}
                                >
                                    현재 복용 중인 영양제 보러 가기
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Loader Target */}
                {hasMore && <div ref={observerTarget} className="loading-trigger">Loading...</div>}
            </div>

            {/* FAB (Floating Action Button) */}
            <button className="fab-button" onClick={onAddClick}>
                <Plus size={24} />
            </button>
        </div>
    );
}
