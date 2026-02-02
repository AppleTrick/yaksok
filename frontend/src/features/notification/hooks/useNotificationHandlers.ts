import { useState } from 'react';
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
     * @param scheduleId - 일정 ID
     * @param itemId - 약 ID
     * @param supplementId - 백엔드 영양제 ID
     */
    const handleConfirm = async (
        scheduleId: string,
        itemId: string,
        supplementId: number
    ) => {
        try {
            // 1. 백엔드 API 호출
            await checkIntake(supplementId);

            // 2. 로컬 상태 업데이트 (홈 페이지 진행률 자동 반영)
            toggleItemTaken(scheduleId, itemId);

            return { success: true };
        } catch (error) {
            console.error('복용 확인 실패:', error);
            alert('복용 체크에 실패했습니다. 다시 시도해주세요.');
            return { success: false, error };
        }
    };

    /**
     * 스누즈 핸들러 (5분 뒤 재알림)
     * @param eventId - 알림 이벤트 ID
     */
    const handleSnooze = async (eventId: number) => {
        try {
            await snoozeNotification(eventId);

            // 스누즈 시간 계산 (현재 시간 + 5분)
            const snoozedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

            // 스누즈 배너 표시
            setSnoozeBanner({
                visible: true,
                snoozedUntil
            });

            // 5분 후 배너 자동 숨김
            setTimeout(() => {
                setSnoozeBanner({ visible: false, snoozedUntil: null });
            }, 5 * 60 * 1000);

            return { success: true, snoozedUntil };
        } catch (error) {
            console.error('스누즈 실패:', error);
            alert('재알림 설정에 실패했습니다.');
            return { success: false, error };
        }
    };

    /**
     * 스누즈 배너 닫기
     */
    const dismissSnoozeBanner = () => {
        setSnoozeBanner({ visible: false, snoozedUntil: null });
    };

    return {
        handleConfirm,
        handleSnooze,
        snoozeBanner,
        dismissSnoozeBanner
    };
}
