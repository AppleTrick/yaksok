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
            // Revert logic could be added here
        } finally {
            setIsSaving(false);
        }
    }, []);

    // Individual updaters
    const togglePush = async (enabled: boolean) => {
        console.log('🔄 togglePush called with:', enabled);

        if (enabled) {
            // ON 시도: 권한 확인 필요
            try {
                // 권한 요청
                const isGranted = await requestPermission();

                if (!isGranted) {
                    // 권한 획득 실패 (거부됨)
                    console.warn('🚫 togglePush: Permission denied');
                    alert('알림 권한이 차단되어 있습니다.\n브라우저 설정에서 사이트 알림 권한을 "허용"으로 변경해주세요.');

                    // 스위치 상태를 다시 OFF로 되돌림 (낙관적 업데이트가 있었다면)
                    // (현재는 save를 호출 안했으므로 UI는 그대로 꺼져있어야 함)
                    return;
                }

                // 권한 획득 성공 -> 서버 저장
                console.log('✅ togglePush: Permission granted. Saving setting...');
                await save({ ...settings, pushEnabled: true });

            } catch (error) {
                console.error('❌ togglePush Error:', error);
                alert('알림 설정을 변경하는 중 오류가 발생했습니다.');
            }
        } else {
            // OFF 시도: 즉시 반영
            console.log('togglePush: Turning OFF');
            await save({ ...settings, pushEnabled: false });
        }
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
