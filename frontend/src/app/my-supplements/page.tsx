"use client";

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem, Cycle } from '@/features/notification/types';
import SupplementDetailModal from '@/features/my-supplements/components/SupplementDetailModal';
import SupplementList from '@/features/my-supplements/components/SupplementList';
import ManualRegistrationForm from '@/features/my-supplements/components/ManualRegistrationForm';
import Modal from '@/components/Modal';
import '@/features/my-supplements/components/styles.css';

export default function MySupplementsPage() {
    const { schedules, updateSchedule } = useScheduleContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<MedicationItem | null>(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    // 1. Flatten and Deduplicate Items by Name
    const uniqueItems = useMemo(() => {
        const map = new Map<string, MedicationItem>();
        schedules.forEach(schedule => {
            schedule.items.forEach(item => {
                // If duplicates exist, we keep the first one found.
                if (!map.has(item.name)) {
                    map.set(item.name, item);
                }
            });
        });
        return Array.from(map.values());
    }, [schedules]);

    // 2. Filter by Search
    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return uniqueItems;
        const lowerTerm = searchTerm.toLowerCase();
        return uniqueItems.filter(item =>
            item.name.toLowerCase().includes(lowerTerm) ||
            item.efficacy?.toLowerCase().includes(lowerTerm) ||
            item.category?.toLowerCase().includes(lowerTerm)
        );
    }, [uniqueItems, searchTerm]);

    // 3. Get Related Schedules for Selected Item
    const relatedSchedules = useMemo(() => {
        if (!selectedItem) return [];
        return schedules
            .filter(s => s.items.some(i => i.name === selectedItem.name))
            .map(s => {
                const itemInSchedule = s.items.find(i => i.name === selectedItem.name);
                return {
                    label: s.label,
                    time: s.time,
                    cycle: itemInSchedule?.cycle || { type: 'daily' } as Cycle
                };
            });
    }, [selectedItem, schedules]);

    // 4. Handle Delete (Remove from ALL schedules)
    const handleDelete = () => {
        if (!selectedItem) return;

        schedules.forEach(schedule => {
            if (schedule.items.some(i => i.name === selectedItem.name)) {
                const newItems = schedule.items.filter(i => i.name !== selectedItem.name);
                // Note: updateSchedule expects rawTime as 2nd arg
                updateSchedule(schedule.id, schedule.items.length === newItems.length ? schedule.rawTime : schedule.rawTime, newItems);
            }
        });

        setSelectedItem(null);
    };

    return (
        <div className="my-supplements-container">
            <div className="page-header">
                <div className="header-title-row">
                    <h1>내 영양제</h1>
                    <span className="count-badge">총 {filteredItems.length}개</span>
                </div>

                <div className="search-bar">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="영양제 이름, 효능 검색"
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <SupplementList
                items={filteredItems}
                onItemClick={setSelectedItem}
                onAddClick={() => setIsRegisterModalOpen(true)}
            />

            {/* Detail Modal */}
            {selectedItem && (
                <SupplementDetailModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                    relatedSchedules={relatedSchedules}
                    onDelete={handleDelete}
                />
            )}

            {/* Registration Modal */}
            <Modal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                title="영양제 등록"
            >
                <ManualRegistrationForm onClose={() => setIsRegisterModalOpen(false)} />
            </Modal>

            {/* Spacing for Bottom Tab Bar */}
            <div style={{ height: "80px" }}></div>
        </div>
    );
}
