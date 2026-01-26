"use client";

import React, { useState } from 'react';
import { MedicationItem } from '@/features/notification/types';
import ScheduleCard from '@/components/ScheduleCard';
import TopBanner from './components/TopBanner';
import WaterCard from './components/WaterCard';
import ScheduleEditModal from './components/ScheduleEditModal';
import { useScheduleContext } from '../notification/contexts/ScheduleContext';
import './components/styles.css';

export default function RemindersFeature() {
    const { schedules, toggleAlarm, updateSchedule } = useScheduleContext();
    const [editingId, setEditingId] = useState<string | null>(null);

    // 2. Open Edit Modal (Card Click)
    const openEditModal = (id: string) => {
        setEditingId(id);
    };

    // 3. Save Changes
    const handleSave = (newRawTime: string, newItems: MedicationItem[]) => {
        if (!editingId) return;
        updateSchedule(editingId, newRawTime, newItems);
        setEditingId(null);
    };

    const editingSchedule = schedules.find(s => s.id === editingId);

    // Filter active schedules or show all (based on requirement)
    // For now show all 

    return (
        <div className="reminders-container">
            {/* Top Banner */}
            <TopBanner remainingCount={schedules.filter(s => s.status === 'upcoming' && s.isActive).length} />

            {/* Timeline */}
            <div className="timeline-list">
                {schedules.map(schedule => (
                    <ScheduleCard
                        key={schedule.id}
                        time={schedule.time}
                        label={schedule.label}
                        items={schedule.items}
                        status={!schedule.isActive ? 'missed' : schedule.status} // Visual cue for inactive
                        onAlarmClick={(e) => toggleAlarm(schedule.id)}
                        onCardClick={() => openEditModal(schedule.id)}
                    />
                ))}
            </div>

            {/* Water Tracking */}
            <div style={{ marginTop: '1.5rem' }}>
                <WaterCard />
            </div>

            {/* Edit Modal */}
            {editingSchedule && (
                <ScheduleEditModal
                    isOpen={!!editingId}
                    onClose={() => setEditingId(null)}
                    initialTime={editingSchedule.rawTime}
                    initialItems={editingSchedule.items}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
