'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFirebaseMessaging, getFCMToken, onMessage } from '@/lib/firebase';
import { saveFCMToken, deleteFCMToken } from '../api/fcmApi';
import type { Messaging } from '@/lib/firebase';

interface UseFCMReturn {
    fcmToken: string | null;
    permission: NotificationPermission;
    isSupported: boolean;
    isLoading: boolean;
    error: string | null;
    requestPermission: () => Promise<boolean>;
    clearToken: () => Promise<void>;
}

/**
 * FCM (Firebase Cloud Messaging) 관리 훅
 * 포그라운드 수신 시 시스템 알림 발송 로직을 제거하고 관리자에게 위임함.
 */
export function useFCM(onNotification?: (data: any) => void): UseFCMReturn {
    const [fcmToken, setFcmToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('fcmToken');
        }
        return null;
    });

    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messaging, setMessaging] = useState<Messaging | null>(null);

    const fetchAndSaveToken = useCallback(async (msgInstance: Messaging) => {
        try {
            const token = await getFCMToken(msgInstance);
            if (token) {
                setFcmToken(token);
                localStorage.setItem('fcmToken', token);
                await saveFCMToken(token, 'web');
                console.log('✅ [useFCM] 토큰 동기화 성공');
            }
        } catch (err) {
            console.error('❌ [useFCM] 토큰 실패:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initMessaging = async () => {
            if (typeof window === 'undefined') return;
            if ('Notification' in window) setPermission(Notification.permission);

            try {
                const messagingInstance = await getFirebaseMessaging();
                if (!messagingInstance) {
                    setIsSupported(false);
                    setIsLoading(false);
                    return;
                }
                setMessaging(messagingInstance);
                setIsSupported(true);

                if (Notification.permission === 'granted') {
                    await fetchAndSaveToken(messagingInstance);
                } else {
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('❌ [useFCM] 초기화 실패:', err);
                setIsSupported(false);
                setIsLoading(false);
            }
        };
        initMessaging();
    }, [fetchAndSaveToken]);

    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.warn('📨 [useFCM] 메시지 수신:', payload);

            const data = payload.data || {};
            const title = data.title || payload.notification?.title || '💊 복약 알림';
            const body = data.body || payload.notification?.body || '영양제 드실 시간입니다.';
            const notificationId = Number(data.notificationId || data.id);
            const userProductId = Number(data.userProductId || data.supplementId || data.user_product_id);

            // 알림 관리자에게 데이터 위임
            if (onNotification) {
                onNotification({ ...data, title, body, notificationId, userProductId });
            }
        });

        return () => {
            // cleanup if provided by library
        };
    }, [messaging, onNotification]);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!messaging) return false;
        try {
            setIsLoading(true);
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm === 'granted') {
                await fetchAndSaveToken(messaging);
                return true;
            }
            setIsLoading(false);
            return false;
        } catch (err) {
            setIsLoading(false);
            return false;
        }
    }, [messaging, fetchAndSaveToken]);

    const clearToken = useCallback(async () => {
        try {
            if (fcmToken) await deleteFCMToken();
            setFcmToken(null);
            localStorage.removeItem('fcmToken');
        } catch (err) {
            setFcmToken(null);
            localStorage.removeItem('fcmToken');
        }
    }, [fcmToken]);

    return {
        fcmToken,
        permission,
        isSupported,
        isLoading,
        error,
        requestPermission,
        clearToken,
    };
}
