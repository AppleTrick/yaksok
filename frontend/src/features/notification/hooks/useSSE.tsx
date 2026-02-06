'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

interface SseData {
    notificationId: number;
    userProductId: number;
    message: string;
    timestamp: string;
}

/**
 * SSE (Server-Sent Events) 수신 훅
 * 시스템 알림 발생 로직을 제거하고, NotificationManager에게 위임함.
 */
export function useSSE(onNotification?: (data: SseData) => void) {
    const searchParams = useSearchParams();

    const processNotification = useCallback((data: SseData) => {
        console.warn('📨 [useSSE] 데이터 수신:', data);

        // 알림 관리자(NotificationManagerEnhanced)에게 데이터 전달
        // 관리자가 중복 체크 후 토스트 또는 시스템 알림을 결정함.
        if (onNotification) {
            onNotification(data);
        }
    }, [onNotification]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const baseUrl = process.env.NODE_ENV === 'development'
            ? 'http://localhost:8080'
            : process.env.NEXT_PUBLIC_API_URL || '';

        console.log('🔌 [useSSE] SSE 연결 시도 중...');
        const eventSource = new EventSource(`${baseUrl}/api/v1/notification/subscribe`, {
            withCredentials: true
        });

        const handleEvent = (event: MessageEvent) => {
            try {
                const data: SseData = JSON.parse(event.data);
                processNotification(data);
            } catch (err) {
                console.error('❌ [useSSE] 데이터 파싱 에러:', err);
            }
        };

        // 1. 커스텀 이벤트 리스너
        eventSource.addEventListener('medication-alarm', handleEvent as EventListener);

        // 2. 기본 메시지 리스너 (보험용)
        eventSource.onmessage = handleEvent;

        eventSource.onopen = () => console.log('✅ [useSSE] SSE 연결 성공');
        eventSource.onerror = () => console.error('❌ [useSSE] SSE 연결 에러 또는 중단');

        return () => {
            eventSource.close();
            console.log('🔌 [useSSE] SSE 연결 해제');
        };
    }, [processNotification]);

    return null;
}
