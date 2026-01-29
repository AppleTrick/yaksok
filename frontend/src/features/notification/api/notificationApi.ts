const API_BASE = '/api';

export interface NotificationRequest {
    userProductId: number;
    intakeTime: string; // "HH:mm"
    category: 'EMPTY' | 'AFTERMEAL' | 'BEFORESLEEP';
    enabled: boolean;
}

export interface NotificationResponse {
    notificationSettingId: number;
    enabled: boolean;
}

export interface SnoozeResponse {
    snoozedUntil: string; // ISO timestamp
}

/**
 * 알림 설정 생성/수정 API
 * @param data - 알림 설정 데이터
 */
export const createOrUpdateNotification = async (
    data: NotificationRequest
): Promise<NotificationResponse> => {
    const response = await fetch(`${API_BASE}/notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('알림 설정 실패');
    }

    const result = await response.json();
    return result.data;
};

/**
 * 알림 스누즈 API
 * @param eventId - 알림 이벤트 ID
 * @param minutes - 스누즈 시간 (기본 5분)
 */
export const snoozeNotification = async (
    eventId: number,
    minutes: number = 5
): Promise<SnoozeResponse> => {
    const response = await fetch(`${API_BASE}/alert/events/${eventId}/snooze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ minutes })
    });

    if (!response.ok) {
        throw new Error('스누즈 실패');
    }

    const result = await response.json();
    return result.data;
};
