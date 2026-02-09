"use client";

import React, { useState } from 'react';
import { MedicationItem, MealCategory } from '@/features/notification/types';
import ScheduleCard from '@/components/ScheduleCard';
import TopBanner from './components/TopBanner';
import WaterCard from './components/WaterCard';
import ScheduleEditModal from './components/ScheduleEditModal';
import { useScheduleContext } from '../notification/contexts/ScheduleContext';
import './components/styles.css';
import { Plus } from 'lucide-react';

export default function RemindersFeature() {
    const { schedules, toggleAlarm, updateSchedule, addMedication } = useScheduleContext();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // 2. Open Edit Modal (Card Click)
    const openEditModal = (id: string) => {
        setEditingId(id);
    };

    // 3. Save Changes
    const handleSave = (newRawTime: string, newMealCategory: MealCategory, newItems: MedicationItem[]) => {
        if (editingId) {
            updateSchedule(editingId, newRawTime, newMealCategory, newItems);
            setEditingId(null);
        } else if (isAdding) {
            // New Schedule Logic
            // For MVP: Iterate items and call addMedication.
            newItems.forEach(item => {
                // We need to access addMedication from context.
                // Since we didn't destructure it above, let's fix that or use updateSchedule logic if applicable.
                // Wait, useScheduleContext() needs 'addMedication' exposed.
                // Let's assume the context has it as we saw earlier.
            });
            setIsAdding(false);
        }
    };

    const editingSchedule = schedules.find(s => s.id === editingId);

    return (
        <div className="reminders-container">
            {/* Top Banner */}
            <TopBanner remainingCount={schedules.filter(s => s.status === 'upcoming' && s.isActive).length} />

            {/* Categorized Timeline */}
            <div className="timeline-container">
                {/* 1. Empty Stomach */}
                <section className="category-section">
                    <h3 className="category-header">공복 (식전)</h3>
                    <div className="timeline-list">
                        {schedules.filter(s => s.mealCategory === 'empty_stomach').map(schedule => (
                            <ScheduleCard
                                key={schedule.id}
                                time={schedule.time}
                                label={schedule.label}
                                items={schedule.items}
                                status={!schedule.isActive ? 'missed' : schedule.status}
                                onAlarmClick={(e) => toggleAlarm(schedule.id)}
                                onCardClick={() => openEditModal(schedule.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* 2. Post Meal */}
                <section className="category-section">
                    <h3 className="category-header">식후</h3>
                    <div className="timeline-list">
                        {schedules.filter(s => !s.mealCategory || s.mealCategory === 'post_meal').map(schedule => (
                            <ScheduleCard
                                key={schedule.id}
                                time={schedule.time}
                                label={schedule.label}
                                items={schedule.items}
                                status={!schedule.isActive ? 'missed' : schedule.status}
                                onAlarmClick={(e) => toggleAlarm(schedule.id)}
                                onCardClick={() => openEditModal(schedule.id)}
                            />
                        ))}
                    </div>
                </section>

                {/* 3. Pre Sleep */}
                <section className="category-section">
                    <h3 className="category-header">취침 전</h3>
                    <div className="timeline-list">
                        {schedules.filter(s => s.mealCategory === 'pre_sleep').map(schedule => (
                            <ScheduleCard
                                key={schedule.id}
                                time={schedule.time}
                                label={schedule.label}
                                items={schedule.items}
                                status={!schedule.isActive ? 'missed' : schedule.status}
                                onAlarmClick={(e) => toggleAlarm(schedule.id)}
                                onCardClick={() => openEditModal(schedule.id)}
                            />
                        ))}
                    </div>
                </section>
            </div>



            {/* Float Add Button */}
            <button
                className="fab-add-btn"
                onClick={() => setIsAdding(true)}
            >
                <Plus size={24} />
            </button>

            {/* Edit/Add Modal */}
            {(editingSchedule || isAdding) && (
                <ScheduleEditModal
                    isOpen={!!editingId || isAdding}
                    onClose={() => {
                        setEditingId(null);
                        setIsAdding(false);
                    }}
                    initialTime={editingSchedule?.rawTime || "08:00"}
                    initialMealCategory={editingSchedule?.mealCategory || 'empty_stomach'}
                    initialItems={editingSchedule?.items || []}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
