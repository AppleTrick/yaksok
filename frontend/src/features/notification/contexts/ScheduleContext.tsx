"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MedicationItem, MealCategory } from '../types';

// 1. Define Types
export interface Schedule {
    id: string;
    time: string; // Display format "오후 2:00"
    rawTime: string; // 24h format "14:00"
    mealCategory: MealCategory;
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
    updateSchedule: (id: string, newRawTime: string, newMealCategory: MealCategory, newItems: MedicationItem[]) => void;
    toggleItemTaken: (scheduleId: string, itemId: string) => void;
    toggleScheduleActive: (scheduleId: string) => void;
    isItemDue: (item: MedicationItem, date: Date) => boolean;
    addMedication: (item: MedicationItem, targetRawTime: string, mealCategory: MealCategory) => void;
    toggleMedicationStatus: (medicationName: string, newStatus: 'taking' | 'stopped') => void;
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
        mealCategory: 'post_meal',
        label: '1시간 후 복용',
        status: 'upcoming',
        items: [
            {
                id: '1',
                name: '뉴트리코어 식물성 오메가3',
                isTaken: false,
                cycle: { type: 'daily' },
                efficacy: '혈행 개선, 눈 건조 개선',
                category: '오메가3',
                ingredients: 'EPA 600mg, DHA 400mg, 비타민E 5mg',
                status: 'taking'
            },
            {
                id: '2',
                name: '솔가 비타민D3 1000IU',
                isTaken: false,
                cycle: { type: 'daily' },
                efficacy: '뼈 건강, 면역력 증진',
                category: '비타민',
                ingredients: '비타민D3 1000IU (25mcg)',
                status: 'taking'
            },
            {
                id: '3',
                name: '닥터베스트 루테인 지아잔틴',
                isTaken: false,
                cycle: { type: 'weekly', daysOfWeek: [1, 3, 5] }, // 월/수/금
                efficacy: '눈 노화 방지, 황반 색소 유지',
                category: '눈 건강',
                ingredients: '루테인 20mg, 지아잔틴 4mg',
                status: 'taking'
            }
        ],
        isActive: true
    },
    {
        id: '2',
        time: '오후 7:00',
        rawTime: '19:00',
        mealCategory: 'post_meal',
        label: '저녁 식사 후',
        status: 'upcoming',
        items: [
            {
                id: '4',
                name: '코자정 (로사르탄칼륨)',
                isTaken: false,
                cycle: { type: 'daily' },
                efficacy: '혈압 조절',
                category: '처방약',
                cautions: '의사의 지시에 따라 매일 정해진 시간에 복용하세요. 임의로 중단하면 안 됩니다.',
                ingredients: '로사르탄칼륨 50mg',
                status: 'taking'
            },
            {
                id: '5',
                name: '닥터스베스트 고흡수 마그네슘',
                isTaken: false,
                cycle: { type: 'interval', interval: 2, startDate: '2025-05-01' }, // 2일 간격
                efficacy: '신경 과민 완화, 근육 이완',
                category: '미네랄',
                ingredients: '마그네슘 200mg (킬레이트)',
                status: 'stopped' // One stopped item for testing
            }
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
    const [date, setDate] = useState<Date>(new Date('2026-01-22'));

    // Load active tab and schedules from localStorage on mount
    useEffect(() => {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) {
            setActiveTab(savedTab as 'daily' | 'weekly');
        }

        // Temporarily disable loading schedules from localStorage to use INITIAL_SCHEDULES
        // const savedSchedules = localStorage.getItem('medication_schedules');
        // if (savedSchedules) {
        //     try {
        //         const parsed = JSON.parse(savedSchedules);
        //         setSchedules(parsed);
        //     } catch (e) {
        //         console.error("Failed to parse schedules from local storage", e);
        //     }
        // }
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
    const updateSchedule = (id: string, newRawTime: string, newMealCategory: MealCategory, newItems: MedicationItem[]) => {
        const [h, m] = newRawTime.split(':').map(Number);
        const ampm = h < 12 ? '오전' : '오후';
        const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
        const displayTime = `${ampm} ${displayHour}:${m.toString().padStart(2, '0')}`;

        setSchedules(prev => prev.map(s =>
            s.id === id ? {
                ...s,
                rawTime: newRawTime,
                mealCategory: newMealCategory,
                time: displayTime,
                items: newItems
            } : s
        ));
    };

    // Action: Add new medication to a schedule (or create new schedule if time doesn't exist - simplified for now: add to first matching time or morning)
    const addMedication = (item: MedicationItem, targetRawTime: string, mealCategory: MealCategory) => {
        setSchedules(prev => {
            const existingScheduleIndex = prev.findIndex(s => s.rawTime === targetRawTime);

            if (existingScheduleIndex >= 0) {
                // Add to existing schedule
                const newSchedules = [...prev];
                newSchedules[existingScheduleIndex] = {
                    ...newSchedules[existingScheduleIndex],
                    items: [...newSchedules[existingScheduleIndex].items, item]
                };
                return newSchedules;
            } else {
                // Create new schedule logic can be complex (sorting etc), for now let's just append or find nearest.
                // To keep it simple for this MVP, we will only allow adding to existing defined times (Morning/Lunch/Dinner)
                // OR we just create a new one.
                const [h, m] = targetRawTime.split(':').map(Number);
                const ampm = h < 12 ? '오전' : '오후';
                const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
                const displayTime = `${ampm} ${displayHour}:${m.toString().padStart(2, '0')}`;

                const newSchedule: Schedule = {
                    id: Date.now().toString(),
                    time: displayTime,
                    rawTime: targetRawTime,
                    mealCategory: mealCategory,
                    label: '새 일정',
                    status: 'upcoming',
                    items: [item],
                    isActive: true
                };
                return [...prev, newSchedule].sort((a, b) => a.rawTime.localeCompare(b.rawTime));
            }
        });
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

    // Action: Toggle Medication Status (Taking <-> Stopped) globally by name
    const toggleMedicationStatus = (medicationName: string, newStatus: 'taking' | 'stopped') => {
        setSchedules(prev => prev.map(schedule => ({
            ...schedule,
            items: schedule.items.map(item =>
                item.name === medicationName
                    ? { ...item, status: newStatus }
                    : item
            )
        })));
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
            isItemDue,
            addMedication,
            toggleMedicationStatus
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
