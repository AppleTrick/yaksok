"use client";

import React, { useState, useMemo } from 'react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem, Cycle } from '@/features/notification/types';
import SupplementDetailModal from '@/features/my-supplements/components/SupplementDetailModal';
import SupplementList from '@/features/my-supplements/components/SupplementList';
import ManualRegistrationForm from '@/features/my-supplements/components/ManualRegistrationForm';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';

import { deleteUserProduct } from '@/features/my-supplements/api/supplementApi';
import '@/features/page.css';
import '@/features/my-supplements/supplements.css';

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
        <VStack className="pg" gap={4}>
            <HStack hAlign="between" vAlign="center">
                <Heading level={1}>내 영양제</Heading>
                <Badge variant="orange" label={`총 ${filteredItems.length}개`} />
            </HStack>

            <TextInput type="search" label="영양제 검색" isLabelHidden placeholder="영양제 이름, 효능 검색" value={searchTerm} onChange={setSearchTerm} size="lg" />

            <SupplementList
                items={filteredItems}
                onItemClick={setSelectedItem}
                onAddClick={() => openRegisterModal()}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

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
                        setActiveTab(newStatus); // 상태를 바꾸면 그 탭으로 옮긴다
                    }}
                    onEdit={() => openRegisterModal(selectedItem)}
                    onSave={() => setSelectedItem(null)}
                />
            )}

            <Dialog isOpen={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen} width="min(440px, 100%)" purpose="form">
                <DialogHeader title={itemToEdit ? '영양제 수정' : '영양제 직접 등록'} onOpenChange={setIsRegisterModalOpen} />
                <VStack padding={4}>
                    <ManualRegistrationForm onClose={() => setIsRegisterModalOpen(false)} initialData={itemToEdit} />
                </VStack>
            </Dialog>
        </VStack>
    );
}
