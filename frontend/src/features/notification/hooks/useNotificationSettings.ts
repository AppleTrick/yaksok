"use client";

import { useState, useEffect, useCallback } from 'react';
import { NotificationSettings, DEFAULT_SETTINGS, MedicationSchedule } from '../types';
import { getNotificationSettings, saveNotificationSettings } from '../api';
import { useFCM } from './useFCM';

export function useNotificationSettings() {
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // FCM 훅 사용
    const { requestPermission } = useFCM();

    // Load settings on mount
    useEffect(() => {
        const load = async () => {
            try {
                const data = await getNotificationSettings();
                setSettings(data);
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    // Save settings helper
    const save = useCallback(async (newSettings: NotificationSettings) => {
        setSettings(newSettings); // Optimistic update
        setIsSaving(true);
        try {
            await saveNotificationSettings(newSettings);
        } catch (error) {
            console.error("Failed to save settings:", error);
            // Revert or show toast (omitted for now)
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Individual updaters
    const togglePush = async (enabled: boolean) => {
        if (enabled) {
            // 푸시 알림을 켤 때 FCM 토큰 발급
            try {
                await requestPermission();
                console.log('✅ FCM 토큰 발급 완료 (togglePush)');
            } catch (error) {
                console.error('❌ FCM 토큰 발급 실패:', error);
            }
        }
        save({ ...settings, pushEnabled: enabled });
    };
    const toggleMissed = (enabled: boolean) => save({ ...settings, missedNotification: enabled });

    // DND Updaters
    const toggleDnd = (enabled: boolean) => save({ ...settings, dndEnabled: enabled });
    const updateDndTime = (key: 'dndStartTime' | 'dndEndTime', value: string) => {
        save({ ...settings, [key]: value });
    };

    // Schedule Updaters
    const updateSchedule = (id: string, updates: Partial<MedicationSchedule>) => {
        const newSchedules = settings.schedules.map(s =>
            s.id === id ? { ...s, ...updates } : s
        );
        save({ ...settings, schedules: newSchedules });
    };

    const addSchedule = () => {
        const newId = Date.now().toString();
        const newSchedule: MedicationSchedule = {
            id: newId,
            label: '새 복용 시간',
            time: '09:00',
            rawTime: '09:00',
            isEnabled: true
        };
        save({ ...settings, schedules: [...settings.schedules, newSchedule] });
    };

    const removeSchedule = (id: string) => {
        const newSchedules = settings.schedules.filter(s => s.id !== id);
        save({ ...settings, schedules: newSchedules });
    };

    return {
        settings,
        isLoading,
        isSaving,
        updateActions: {
            togglePush,
            toggleMissed,
            toggleDnd,
            updateDndTime,
            updateSchedule,
            addSchedule,
            removeSchedule
        }
    };
}
