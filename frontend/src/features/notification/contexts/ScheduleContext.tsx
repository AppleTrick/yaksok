"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MedicationItem } from '../types';

// 1. Define Types
export interface Schedule {
    id: string;
    time: string; // Display format "오후 2:00"
    rawTime: string; // 24h format "14:00"
    label: string;
    status: 'upcoming' | 'done' | 'missed';
    items: MedicationItem[];
    isActive: boolean;
}

interface ScheduleContextType {
    activeTab: 'daily' | 'weekly';
    setActiveTab: (tab: 'daily' | 'weekly') => void;
    date: Date;
    setDate: (date: Date) => void;
    schedules: Schedule[];
    toggleAlarm: (id: string) => void;
    updateSchedule: (id: string, newRawTime: string, newItems: MedicationItem[]) => void;
    toggleItemTaken: (scheduleId: string, itemId: string) => void;
    toggleScheduleActive: (scheduleId: string) => void;
    isItemDue: (item: MedicationItem, date: Date) => boolean;
}

// Helper: Check if item is due on specific date
export const isItemDue = (item: MedicationItem, date: Date): boolean => {
    const { cycle } = item;

    if (cycle.type === 'daily') return true;

    if (cycle.type === 'weekly') {
        if (!cycle.daysOfWeek || cycle.daysOfWeek.length === 0) return false;
        const day = date.getDay(); // 0-6
        return cycle.daysOfWeek.includes(day);
    }

    if (cycle.type === 'interval') {
        if (!cycle.startDate || !cycle.interval) return false;

        const start = new Date(cycle.startDate);
        const target = new Date(date);

        // Normalize time to 00:00:00 for correct day diff
        start.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays >= 0 && diffDays % cycle.interval === 0;
    }

    return false;
};

// 2. Mock Initial Data
const INITIAL_SCHEDULES: Schedule[] = [
    {
        id: '1',
        time: '오후 2:00',
        rawTime: '14:00',
        label: '1시간 후 복용',
        status: 'upcoming',
        items: [
            { id: '1', name: '오메가3', isTaken: false, cycle: { type: 'daily' } },
            { id: '2', name: '비타민D', isTaken: false, cycle: { type: 'daily' } },
            { id: '3', name: '루테인', isTaken: false, cycle: { type: 'weekly', daysOfWeek: [1, 3, 5] } } // 월/수/금
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
            { id: '4', name: '혈압약', isTaken: false, cycle: { type: 'daily' } },
            { id: '5', name: '마그네슘', isTaken: false, cycle: { type: 'interval', interval: 2, startDate: '2025-05-01' } } // 2일 간격
        ],
        isActive: true
    }
];

// 3. Create Context
const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// 4. Provider Component
export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
    const [schedules, setSchedules] = useState<Schedule[]>(INITIAL_SCHEDULES);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
    const [date, setDate] = useState<Date>(new Date());

    // Load active tab and schedules from localStorage on mount
    useEffect(() => {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) {
            setActiveTab(savedTab as 'daily' | 'weekly');
        }

        const savedSchedules = localStorage.getItem('medication_schedules');
        if (savedSchedules) {
            try {
                const parsed = JSON.parse(savedSchedules);
                setSchedules(parsed);
            } catch (e) {
                console.error("Failed to parse schedules from local storage", e);
            }
        }
    }, []);

    // Save schedules to localStorage whenever they change
    useEffect(() => {
        if (schedules !== INITIAL_SCHEDULES) {
            localStorage.setItem('medication_schedules', JSON.stringify(schedules));
        }
    }, [schedules]);

    // Save activeTab to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    // Action: Toggle Alarm
    const toggleAlarm = (id: string) => {
        setSchedules(prev => prev.map(s =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
        ));
    };

    // Action: Update Schedule (Time, Items)
    const updateSchedule = (id: string, newRawTime: string, newItems: MedicationItem[]) => {
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

            return { ...schedule, items: updatedItems };
        }));
    };

    const toggleScheduleActive = (scheduleId: string) => {
        setSchedules(prev => prev.map(s =>
            s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
        ));
    };

    return (
        <ScheduleContext.Provider value={{
            activeTab,
            setActiveTab,
            date,
            setDate,
            schedules,
            toggleAlarm,
            updateSchedule,
            toggleItemTaken,
            toggleScheduleActive,
            isItemDue
        }}>
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
