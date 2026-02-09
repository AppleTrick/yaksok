"use client";

import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem, Cycle } from '@/features/notification/types';
import SupplementDetailModal from '@/features/my-supplements/components/SupplementDetailModal';
import SupplementList from '@/features/my-supplements/components/SupplementList';
import ManualRegistrationForm from '@/features/my-supplements/components/ManualRegistrationForm';
import Modal from '@/components/Modal';
import { deleteUserProduct } from '@/features/my-supplements/api/supplementApi';
import '@/features/my-supplements/styles.css';

export default function MySupplementsPage() {
    const { schedules, refreshSchedules, toggleMedicationStatus } = useScheduleContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<MedicationItem | null>(null);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'taking' | 'stopped'>('taking');

    // 마운트 시 데이터 새로고침
    React.useEffect(() => {
        refreshSchedules();
    }, [refreshSchedules]);

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
    const handleDelete = async () => {
        if (!selectedItem) return;

        try {
            await deleteUserProduct(Number(selectedItem.id));
            await refreshSchedules();
            setSelectedItem(null);
        } catch (error) {
            console.error("Failed to delete supplement:", error);
            alert("삭제에 실패했습니다. 다시 시도해 주세요.");
        }
    };

    // 5. Handle Edit
    const handleEdit = () => {
        if (!selectedItem) return;
        setIsRegisterModalOpen(true);
        // We keep selectedItem set so the modal stays open? 
        // No, we want to open RegisterModal with data. And Close DetailModal?
        // Let's close DetailModal first.
        setSelectedItem(null);
        // Wait, if we close detail modal, we lose selectedItem context for initialData.
        // We need a separate state for `editingItem` or just pass `selectedItem` to the form BEFORE clearing it.
        // Actually, `isRegisterModalOpen` controls the form using `ManualRegistrationForm`.
        // We need to pass `initialData` to it.
        // I'll add a `itemToEdit` state.
    };

    const [itemToEdit, setItemToEdit] = useState<MedicationItem | undefined>(undefined);

    const openRegisterModal = (item?: MedicationItem) => {
        setItemToEdit(item);
        setIsRegisterModalOpen(true);
        if (item) setSelectedItem(null); // Close detail modal if editing
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
                onAddClick={() => openRegisterModal()}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {/* Detail Modal */}
            {selectedItem && (
                <SupplementDetailModal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    item={selectedItem}
                    relatedSchedules={relatedSchedules}
                    onDelete={handleDelete}
                    onToggleStatus={(newStatus) => {
                        toggleMedicationStatus(selectedItem.name, newStatus);
                        setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
                        // 상태 변경 시 자동으로 해당 탭으로 전환
                        setActiveTab(newStatus);
                    }}
                    onEdit={() => openRegisterModal(selectedItem)}
                    onSave={() => setSelectedItem(null)} // 저장 후 모달 닫기
                />
            )}

            {/* Registration Modal */}
            <Modal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                title={itemToEdit ? "수정" : "등록"}
            >
                <ManualRegistrationForm
                    onClose={() => setIsRegisterModalOpen(false)}
                    initialData={itemToEdit}
                />
            </Modal>

            {/* Spacing for Bottom Tab Bar */}
            <div style={{ height: "80px" }}></div>
        </div>
    );
}
