import { useState, useCallback } from 'react';
import { useScheduleContext } from '../contexts/ScheduleContext';
import { checkIntake } from '../api/intakeApi';
import { snoozeNotification } from '../api/notificationApi';

export function useNotificationHandlers() {
    const { toggleItemTaken } = useScheduleContext();
    const [snoozeBanner, setSnoozeBanner] = useState<{
        visible: boolean;
        snoozedUntil: string | null;
    }>({ visible: false, snoozedUntil: null });

    /**
     * 복용 완료 핸들러
     */
    const handleConfirm = useCallback(async (
        scheduleId: string,
        itemId: string,
        supplementId: number
    ) => {
        try {
            await checkIntake(supplementId);
            toggleItemTaken(scheduleId, itemId);
            return { success: true };
        } catch (error) {
            console.error('복용 확인 실패:', error);
            alert('복용 체크에 실패했습니다. 다시 시도해주세요.');
            return { success: false, error };
        }
    }, [toggleItemTaken]);

    /**
     * 스누즈 핸들러 (5분 뒤 재알림)
     */
    const handleSnooze = useCallback(async (eventId: number) => {
        try {
            await snoozeNotification(eventId);
            const snoozedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            setSnoozeBanner({ visible: true, snoozedUntil });

            setTimeout(() => {
                setSnoozeBanner({ visible: false, snoozedUntil: null });
            }, 5 * 60 * 1000);

            return { success: true, snoozedUntil };
        } catch (error) {
            console.error('스누즈 실패:', error);
            alert('재알림 설정에 실패했습니다.');
            return { success: false, error };
        }
    }, []);

    const dismissSnoozeBanner = useCallback(() => {
        setSnoozeBanner({ visible: false, snoozedUntil: null });
    }, []);

    return {
        handleConfirm,
        handleSnooze,
        snoozeBanner,
        dismissSnoozeBanner
    };
}
