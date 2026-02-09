"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { MedicationItem, MealCategory } from '../types';
import { getTodayIntakes, checkIntake, TodayIntake } from '../api/intakeApi';
import { getNotifications } from '../api/notificationApi';

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
    isLoading: boolean;
    refreshSchedules: () => Promise<void>;

    toggleAlarm: (id: string) => void;
    updateSchedule: (id: string, newRawTime: string, newMealCategory: MealCategory, newItems: MedicationItem[]) => void;
    toggleItemTaken: (scheduleId: string, itemId: string) => Promise<void>;
    toggleScheduleActive: (scheduleId: string) => void;
    isItemDue: (item: MedicationItem, date: Date) => boolean;
    addMedication: (item: MedicationItem, targetRawTime: string, mealCategory: MealCategory) => void;
    toggleMedicationStatus: (medicationName: string, newStatus: 'taking' | 'stopped') => Promise<void>;
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
        start.setHours(0, 0, 0, 0);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays % cycle.interval === 0;
    }
    return false;
};

// Helper: 백엔드 category → 프론트 mealCategory 변환
function getCategoryFromNotification(category: string): MealCategory {
    switch (category) {
        case 'EMPTY': return 'empty_stomach';
        case 'AFTERMEAL': return 'post_meal';
        case 'BEFORESLEEP': return 'pre_sleep';
        default: return 'post_meal';
    }
}

// 3. Create Context
const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// 4. Provider Component
export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
    const [date, setDate] = useState<Date>(new Date());
    const [isLoading, setIsLoading] = useState(false);

    // Initial Load & Tab Persistence
    useEffect(() => {
        const savedTab = localStorage.getItem('activeTab');
        if (savedTab) setActiveTab(savedTab as 'daily' | 'weekly');

        // Initial fetch
        refreshSchedules();
    }, []);

    useEffect(() => {
        localStorage.setItem('activeTab', activeTab);
    }, [activeTab]);

    // Data Fetching Logic - 수정된 부분
    const refreshSchedules = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. 백엔드에서 알림 데이터 가져오기 (각 제품별 시간 포함)
            const notificationsResponse = await getNotifications();
            const notifications = notificationsResponse.data.notifications;

            if (!notifications || notifications.length === 0) {
                setSchedules([]);
                return;
            }

            // 2. 시간별로 그룹화
            const scheduleMap = new Map<string, Schedule>();

            for (const notif of notifications) {
                const rawTime = notif.intakeTime; // "14:00"
                if (!rawTime) continue; // 시간 정보가 없으면 스킵

                const [h, m] = rawTime.split(':').map(Number);
                const ampm = h < 12 ? '오전' : '오후';
                const displayHour = h === 0 ? 12 : (h > 12 ? h - 12 : h);
                const displayTime = `${ampm} ${displayHour}:${m.toString().padStart(2, '0')}`;

                // 해당 시간의 스케줄이 없으면 생성
                if (!scheduleMap.has(rawTime)) {
                    scheduleMap.set(rawTime, {
                        id: `schedule-${rawTime}`,
                        time: displayTime,
                        rawTime: rawTime,
                        mealCategory: getCategoryFromNotification(notif.category),
                        label: `${displayTime} 복용`,
                        status: 'upcoming',
                        items: [],
                        isActive: notif.enabled
                    });
                }

                // 해당 시간 스케줄에 아이템 추가
                const schedule = scheduleMap.get(rawTime)!;

                // MedicationItem 생성
                // Note: API 응답에 nickname이 포함되어 있지만 타입에는 정의되어 있지 않음
                const notifWithNickname = notif as any;
                const item: MedicationItem = {
                    id: String(notif.userProductId),
                    name: notifWithNickname.nickname || `제품 #${notif.userProductId}`,
                    nickname: notifWithNickname.nickname,
                    productName: notifWithNickname.nickname,
                    isTaken: notif.isTaken || false,
                    cycle: { type: 'daily' },
                    status: 'taking',
                    efficacy: '',
                    category: '영양제',
                    detail: undefined,
                    ingredients: undefined,
                    cautions: undefined
                };

                schedule.items.push(item);
            }

            // 3. Map을 배열로 변환하고 시간순 정렬
            const sortedSchedules = Array.from(scheduleMap.values())
                .sort((a, b) => a.rawTime.localeCompare(b.rawTime));

            setSchedules(sortedSchedules);

        } catch (error) {
            console.error("Failed to fetch schedules:", error);

            // 실패 시 기존 getTodayIntakes 폴백
            try {
                const todayIntakes = await getTodayIntakes();

                if (!todayIntakes || todayIntakes.length === 0) {
                    setSchedules([]);
                    return;
                }

                const convertedItems: MedicationItem[] = todayIntakes.map(ti => ({
                    id: String(ti.userProductId),
                    name: ti.productName || ti.nickname || '제품명 없음',
                    productName: ti.productName || undefined,
                    nickname: ti.nickname || undefined,
                    detail: (ti.doseAmount && ti.doseUnit)
                        ? `${ti.doseAmount}${ti.doseUnit}`
                        : (ti.doseAmount ? `${ti.doseAmount}정` : undefined),
                    ingredients: ti.ingredients || undefined,
                    cautions: ti.cautions || undefined,
                    isTaken: ti.taken,
                    cycle: { type: 'daily' },
                    efficacy: '',
                    category: '영양제',
                    status: 'taking'
                }));

                const todaySchedule: Schedule = {
                    id: 'today-schedule',
                    time: '오늘의 복용',
                    rawTime: '09:00',
                    mealCategory: 'post_meal',
                    label: '오늘 섭취할 영양제',
                    status: 'upcoming',
                    items: convertedItems,
                    isActive: true
                };

                setSchedules([todaySchedule]);
            } catch (fallbackError) {
                console.error("Fallback also failed:", fallbackError);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);


    // Action: Toggle Alarm (Local UI only for now)
    const toggleAlarm = useCallback((id: string) => {
        setSchedules(prev => prev.map(s =>
            s.id === id ? { ...s, isActive: !s.isActive } : s
        ));
    }, []);

    // [Moved] Listen for updates from Service Worker or NotificationManager
    useEffect(() => {
        const channel = new BroadcastChannel('pill_channel');

        const handleMessage = (event: MessageEvent) => {
            console.log('📢 [ScheduleContext] 외부 상태 변경 감지:', event.data);
            if (event.data.type === 'PILL_TAKEN_COMPLETE' || event.data.type === 'PILL_SNOOZE_COMPLETE') {
                refreshSchedules();
            }
        };

        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
        };
    }, [refreshSchedules]);

    // Action: Update Schedule (Local -> API placeholder)
    const updateSchedule = useCallback((id: string, newRawTime: string, newMealCategory: MealCategory, newItems: MedicationItem[]) => {
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
    }, []);

    // Action: Add Medication (Triggers refresh)
    const addMedication = useCallback((item: MedicationItem, targetRawTime: string, mealCategory: MealCategory) => {
        // Assume API call is done by the form
        refreshSchedules();
    }, [refreshSchedules]);

    // Action: Toggle Item Taken (API Call)
    const toggleItemTaken = useCallback(async (scheduleId: string, itemId: string) => {
        // 1. Optimistic Update (UI 즉시 반영)
        setSchedules(prev => prev.map(schedule => {
            if (schedule.id !== scheduleId) return schedule;
            return {
                ...schedule,
                items: schedule.items.map(item =>
                    item.id === itemId ? { ...item, isTaken: !item.isTaken } : item
                )
            };
        }));

        try {
            // 2. Call Backend
            await checkIntake(Number(itemId));

            // 3. Sync with Backend (토글 불일치 방지)
            // 백엔드의 토글 로직과 UI 상태를 확실하게 맞추기 위해 최신 데이터를 다시 불러옵니다.
            await refreshSchedules();
        } catch (error) {
            console.error("Failed to sync taken status:", error);
            // 에러 시에도 원복을 위해 새로고침
            refreshSchedules();
        }
    }, [refreshSchedules]);

    const toggleScheduleActive = useCallback((scheduleId: string) => {
        setSchedules(prev => prev.map(s =>
            s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
        ));
    }, []);

    const toggleMedicationStatus = async (medicationName: string, newStatus: 'taking' | 'stopped') => {
        // Optimistic UI Update: Update status in all schedules containing this medication
        setSchedules(prev => prev.map(schedule => ({
            ...schedule,
            items: schedule.items.map(item =>
                item.name === medicationName
                    ? { ...item, status: newStatus }
                    : item
            )
        })));

        // Backend sync would go here if there's an API endpoint
        // For now, the status change is local only
        // TODO: Call backend API to update active status when available
        console.log(`Updated ${medicationName} status to ${newStatus}`);
    };

    return (
        <ScheduleContext.Provider value={{
            activeTab,
            setActiveTab,
            date,
            setDate,
            schedules,
            isLoading,
            refreshSchedules,
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

export function useScheduleContext() {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useScheduleContext must be used within a ScheduleProvider');
    }
    return context;
}
