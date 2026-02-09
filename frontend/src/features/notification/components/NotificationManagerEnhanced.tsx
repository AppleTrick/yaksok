"use client";

import React, { useState, useCallback, useRef } from 'react';
import NotificationModal from '@/components/NotificationModal';
import NotificationToast from './NotificationToast';
import { useNotificationHandlers } from '../hooks/useNotificationHandlers';
import { useSSE } from '../hooks/useSSE';
import { useFCM } from '../hooks/useFCM';
import { markNotificationTaken } from '../api/notificationApi';

export default function NotificationManagerEnhanced() {
    const [activeToast, setActiveToast] = useState<{
        title: string;
        body: string;
        notificationIds: number[];
        userProductIds: number[];
    } | null>(null);

    // 중복 방지를 위한 ID 추적 (전역적 관리)
    const processedIds = useRef<Set<number>>(new Set());

    const { handleConfirm, handleSnooze, snoozeBanner, dismissSnoozeBanner } = useNotificationHandlers();

    // 알림 노출 통합 컨트롤러
    const handleNewNotification = useCallback((data: any) => {
        console.warn('🔔 [NotificationManager] 알림 처리 시작:', data);

        // 낱개 ID 또는 묶음 IDs 파싱
        let ids: number[] = [];
        if (data.notificationIds) {
            ids = String(data.notificationIds).split(',').map(Number);
        } else {
            const id = Number(data.notificationId || data.id);
            if (id) ids = [id];
        }

        if (ids.length === 0) return;

        // 1. [중복 방지] 최근 10초 내 동일 ID 필터링
        const freshIds = ids.filter(id => !processedIds.current.has(id));
        if (freshIds.length === 0) {
            console.warn('🚫 [NotificationManager] 이미 처리된 알림 ID들:', ids);
            return;
        }

        freshIds.forEach(id => processedIds.current.add(id));
        setTimeout(() => {
            freshIds.forEach(id => processedIds.current.delete(id));
        }, 10000);

        const title = data.title || '💊 복약 알림';
        const body = data.message || data.body || '영양제 드실 시간입니다.';

        let productIds: number[] = [];
        if (data.userProductIds) {
            productIds = String(data.userProductIds).split(',').map(Number);
        } else {
            const pid = Number(data.userProductId || data.supplementId || data.user_product_id);
            if (pid) productIds = [pid];
        }

        // 2. [인앱 토스트] 즉시 노출 (포그라운드 전용)
        setActiveToast({ title, body, notificationIds: ids, userProductIds: productIds });

        // 3. [시스템 알림] 가시성에 따른 지능적 노출
        if (document.visibilityState === 'hidden' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
            const tag = `medication-${ids[0]}`; // 첫 번째 ID를 태그로 사용

            navigator.serviceWorker.ready.then(registration => {
                console.log('📢 [NotificationManager] 백그라운드 시스템 알림 발송:', tag);
                registration.showNotification(title, {
                    body,
                    icon: '/icons/logo.png',
                    badge: '/icons/logo.png',
                    vibrate: [200, 100, 200],
                    tag,
                    renotify: true,
                    requireInteraction: true,
                    data: { ...data, notificationIds: ids, userProductIds: productIds },
                    actions: [
                        // 버튼 순서 변경: 미루기(좌), 복용(우)
                        { action: 'snooze', title: '⏰ 나중에 알림' },
                        { action: 'complete', title: '✅ 지금 복용' }
                    ]
                } as any);
            }).catch(err => console.error('SW Ready Error:', err));
        } else {
            console.log('ℹ️ [NotificationManager] 포그라운드 상태이므로 시스템 알림 생략');
        }
    }, []);

    // 훅 연결 (데이터 수신은 훅이, 처리는 매니저가 함)
    useSSE(handleNewNotification);
    useFCM(handleNewNotification);

    const onToastConfirm = async (notificationIds: number[], productIds: number[]) => {
        try {
            // 1. 모든 알림 레코드를 '확인됨'으로 마킹 (Notification.intaken = true)
            // 참고: NotificationService.intake 메서드 수행 시, @Transactional 안에서 'intaken=true'가 강제 설정되므로
            // 별도로 intakes/check(토글)를 호출할 필요가 없습니다. (오히려 토글 시 '안 먹음'으로 바뀔 위험 제거)
            await Promise.all(notificationIds.map(id => markNotificationTaken(id)));

            console.log('💊 [NotificationManager] 복용 처리 완료 (강제 설정)');

            // [New] 리스트 UI 갱신을 위해 브로드캐스트 이벤트 발행
            const channel = new BroadcastChannel('pill_channel');
            channel.postMessage({
                type: 'PILL_TAKEN_COMPLETE',
                notificationIds,
                timestamp: Date.now()
            });
            channel.close();

            // 2. [제거됨] handleConfirm (토글) 호출 제거
            // if (productIds.length > 0) { ... }
            setActiveToast(null);
        } catch (error) {
            console.error('❌ 복용 처리 실패:', error);
        }
    };

    const onToastSnooze = async (notificationIds: number[]) => {
        try {
            // 모든 알림에 대해 미루기 처리
            await Promise.all(notificationIds.map(id => handleSnooze(id)));
            setActiveToast(null);
        } catch (error) {
            console.error('❌ 미루기 처리 실패:', error);
        }
    };

    return (
        <>
            {activeToast && (
                <NotificationToast
                    data={activeToast}
                    onConfirm={onToastConfirm}
                    onSnooze={onToastSnooze}
                    onClose={() => setActiveToast(null)}
                />
            )}

            {snoozeBanner.visible && (
                <div className="snooze-banner" style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#FF5722',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    zIndex: 2147483646,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>⏰ 5분 후에 다시 알려드릴게요</p>
                    <button
                        onClick={dismissSnoozeBanner}
                        style={{
                            background: 'rgba(255,255,255,0.2)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </>
    );
}
