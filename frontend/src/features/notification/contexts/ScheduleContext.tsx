"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScheduleItem } from '@/components/ScheduleCard';

// 1. Define Types
export interface Schedule {
    id: string;
    time: string; // Display format "오후 2:00"
    rawTime: string; // 24h format "14:00"
    label: string;
    status: 'upcoming' | 'done' | 'missed';
    items: ScheduleItem[];
    isActive: boolean;
}

interface ScheduleContextType {
    schedules: Schedule[];
    toggleAlarm: (id: string) => void;
    updateSchedule: (id: string, newRawTime: string, newItems: ScheduleItem[]) => void;
    toggleItemTaken: (scheduleId: string, itemId: string) => void;
}

// 2. Mock Initial Data (Moved from RemindersFeature)
const INITIAL_SCHEDULES: Schedule[] = [
    {
        id: '1',
        time: '오후 2:00',
        rawTime: '14:00',
        label: '1시간 후 복용',
        status: 'upcoming',
        items: [
            { id: '1', name: '오메가3', isTaken: false },
            { id: '2', name: '비타민D', isTaken: false },
            { id: '3', name: '루테인', isTaken: false }
        ],
        isActive: true
    },
    {
        id: '2',
        time: '오후 7:00',
        rawTime: '19:00',
        label: '저녁 식사 후',
        status: 'upcoming',
        items: [
            { id: '4', name: '혈압약', isTaken: false },
            { id: '5', name: '마그네슘', isTaken: false }
        ],
        isActive: true
    }
];

// 3. Create Context
const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// 4. Provider Component
export function ScheduleProvider({ children }: { children: ReactNode }) {
    const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);

    // Action: Toggle Alarm (Bell)
    const toggleAlarm = (id: string) => {
        setSchedules(prev => prev.map(s =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
        ));
    };

    // Action: Update Schedule (Time & Items)
    const updateSchedule = (id: string, newRawTime: string, newItems: ScheduleItem[]) => {
        // Convert rawTime to display time
        const [h, m] = newRawTime.split(':').map(Number);
        const ampm = h < 12 ? '오전' : '오후';
        const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
        const displayTime = `${ampm} ${displayHour}:${m.toString().padStart(2, '0')}`;

        setSchedules(prev => prev.map(s =>
            s.id === id ? {
                ...s,
                rawTime: newRawTime,
                time: displayTime,
                items: newItems
            } : s
        ));
    };

    // Action: Toggle Item Taken (Checkbox)
    const toggleItemTaken = (scheduleId: string, itemId: string) => {
        setSchedules(prev => prev.map(schedule => {
            if (schedule.id !== scheduleId) return schedule;

            const updatedItems = schedule.items.map(item =>
                item.id === itemId ? { ...item, isTaken: !item.isTaken } : item
            );

            // Check if all items are taken -> update schedule status
            const allTaken = updatedItems.every(i => i.isTaken);
            // Simple logic: if all taken -> done, else -> upcoming (or missed logic if time passed)
            // For now, let's keep it simple.

            return { ...schedule, items: updatedItems };
        }));
    };

    return (
        <ScheduleContext.Provider value={{ schedules, toggleAlarm, updateSchedule, toggleItemTaken }}>
            {children}
        </ScheduleContext.Provider>
    );
}

// 5. Custom Hook
export function useScheduleContext() {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useScheduleContext must be used within a ScheduleProvider');
    }
    return context;
}
