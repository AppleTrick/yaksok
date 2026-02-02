'use client';

import { useEffect, useState, useCallback } from 'react';
import { getFirebaseMessaging, getFCMToken, onMessage } from '@/lib/firebase';
import { saveFCMToken, deleteFCMToken } from '../api/fcmApi';
import type { Messaging } from '@/lib/firebase';

interface UseFCMReturn {
    fcmToken: string | null;
    isSupported: boolean;
    isLoading: boolean;
    error: string | null;
    requestPermission: () => Promise<void>;
    clearToken: () => Promise<void>;
}

/**
 * FCM (Firebase Cloud Messaging) 관리 훅
 * - FCM 토큰 발급 및 백엔드 저장
 * - 포그라운드 메시지 수신
 * - 알림 권한 관리
 */
export function useFCM(): UseFCMReturn {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [messaging, setMessaging] = useState<Messaging | null>(null);

    // Firebase Messaging 초기화
    useEffect(() => {
        const initMessaging = async () => {
            try {
                const messagingInstance = await getFirebaseMessaging();

                if (!messagingInstance) {
                    setIsSupported(false);
                    setIsLoading(false);
                    return;
                }

                setMessaging(messagingInstance);
                setIsSupported(true);
                setIsLoading(false);
            } catch (err) {
                console.error('FCM 초기화 실패:', err);
                setError(err instanceof Error ? err.message : 'Messaging 초기화 실패');
                setIsSupported(false);
                setIsLoading(false);
            }
        };

        initMessaging();
    }, []);

    // 포그라운드 메시지 수신 리스너 설정
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('📨 포그라운드 메시지 수신:', payload);

            // 브라우저가 열려있을 때 알림 표시
            if (Notification.permission === 'granted') {
                const title = payload.notification?.title || '알림';
                const options = {
                    body: payload.notification?.body || '',
                    icon: payload.notification?.icon || '/icons/icon-192x192.png',
                    badge: '/icons/badge-72x72.png',
                    vibrate: [200, 100, 200],
                    data: payload.data,
                };

                new Notification(title, options);
            }
        });

        return () => {
            // Cleanup (onMessage는 unsubscribe 함수를 반환하지 않으므로 별도 처리 불필요)
        };
    }, [messaging]);

    /**
     * 알림 권한 요청 및 FCM 토큰 발급
     */
    const requestPermission = useCallback(async () => {
        if (!messaging) {
            setError('Firebase Messaging이 초기화되지 않았습니다.');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // 알림 권한 요청
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setError('알림 권한이 거부되었습니다.');
                setIsLoading(false);
                return;
            }

            // FCM 토큰 발급
            const token = await getFCMToken(messaging);

            if (!token) {
                setError('FCM 토큰 발급에 실패했습니다.');
                setIsLoading(false);
                return;
            }

            setFcmToken(token);
            console.log('✅ FCM 토큰 발급 완료:', token);

            // localStorage에 토큰 저장
            localStorage.setItem('fcmToken', token);
            console.log('✅ FCM 토큰 localStorage 저장 완료');

            // 백엔드에 토큰 저장
            await saveFCMToken(token, 'web');
            console.log('✅ FCM 토큰 백엔드 저장 완료');

            setIsLoading(false);
        } catch (err) {
            console.error('FCM 권한 요청 오류:', err);
            setError(err instanceof Error ? err.message : 'FCM 초기화 실패');
            setIsLoading(false);
        }
    }, [messaging]);

    /**
     * FCM 토큰 삭제 (로그아웃 시 사용)
     */
    const clearToken = useCallback(async () => {
        try {
            await deleteFCMToken();
            setFcmToken(null);
            console.log('✅ FCM 토큰 삭제 완료');
        } catch (err) {
            console.error('FCM 토큰 삭제 오류:', err);
            throw err;
        }
    }, []);

    return {
        fcmToken,
        isSupported,
        isLoading,
        error,
        requestPermission,
        clearToken,
    };
}
