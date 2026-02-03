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
    requestPermission: () => Promise<boolean>; // Return boolean for success/fail
    clearToken: () => Promise<void>;
}

/**
 * FCM (Firebase Cloud Messaging) 관리 훅
 * - FCM 토큰 발급 및 백엔드 저장
 * - 포그라운드 메시지 수신
 * - 알림 권한 관리
 */
export function useFCM(): UseFCMReturn {
    // 1. 초기 상태: localStorage에서 토큰이 있으면 일단 가져옴 (UI 깜빡임 방지)
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

    // 3. 토큰 발급 및 저장 헬퍼 함수
    const fetchAndSaveToken = async (msgInstance: Messaging) => {
        try {
            const token = await getFCMToken(msgInstance);
            if (token) {
                setFcmToken(token);
                localStorage.setItem('fcmToken', token);
                await saveFCMToken(token, 'web');
                console.log('✅ FCM 토큰 동기화 완료:', token);
            } else {
                console.warn('⚠️ FCM 토큰을 가져오지 못했습니다.');
            }
        } catch (err) {
            console.error('❌ FCM 토큰 발급/저장 실패:', err);
            // 토큰 발급 실패 시 기존 잘못된 토큰이 있다면 정리
            // setFcmToken(null);
            // localStorage.removeItem('fcmToken');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. 초기화 (Messaging 가져오기 & 권한 상태 확인)
    useEffect(() => {
        const initMessaging = async () => {
            if (typeof window === 'undefined') return;

            // 권한 상태 동기화
            if ('Notification' in window) {
                setPermission(Notification.permission);
            }

            try {
                const messagingInstance = await getFirebaseMessaging();

                if (!messagingInstance) {
                    console.warn('⚠️ FCM이 지원되지 않는 환경입니다.');
                    setIsSupported(false);
                    setIsLoading(false);
                    return;
                }

                setMessaging(messagingInstance);
                setIsSupported(true);

                // 권한이 이미 허용된 경우 토큰 갱신 시도
                if (Notification.permission === 'granted') {
                    // 이미 토큰이 State에 있어도, 최신 토큰인지 확인 및 백엔드 Sync를 위해 재발급 시도
                    // (단, 너무 빈번한 호출을 막기 위해 localStorage 검사 등 최적화 가능하지만, 여기선 안정성 우선)
                    fetchAndSaveToken(messagingInstance);
                } else {
                    setIsLoading(false);
                }

            } catch (err) {
                console.error('❌ FCM 초기화 실패:', err);
                setError(err instanceof Error ? err.message : 'Messaging 초기화 실패');
                setIsSupported(false);
                setIsLoading(false);
            }
        };

        initMessaging();
    }, []);

    // 4. 포그라운드 메시지 리스너
    useEffect(() => {
        if (!messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('📨 포그라운드 메시지 수신:', payload);

            if (Notification.permission === 'granted') {
                const data = payload.data || {};
                const title = data.title || payload.notification?.title || '알림';
                const body = data.body || payload.notification?.body || '';
                const tag = data.notificationId ? `medication-${data.notificationId}` : undefined;

                new Notification(title, {
                    body,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/badge-72x72.png',
                    vibrate: [200, 100, 200],
                    data: data,
                    tag: tag,
                } as any);
            }
        });

        return () => {
            // onMessage returns void in some versions, but check lib signature
        };
    }, [messaging]);

    // 5. 권한 요청 함수 (User Interaction)
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!messaging) {
            setError('Firebase Messaging이 아직 준비되지 않았습니다.');
            return false;
        }

        try {
            setIsLoading(true);
            setError(null);

            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm === 'granted') {
                console.log('🔔 알림 권한 허용됨. 토큰 발급 시도...');
                await fetchAndSaveToken(messaging);
                return true;
            } else {
                console.warn('🚫 알림 권한 거부됨');
                setError('알림 권한이 거부되었습니다.');
                setIsLoading(false);
                return false;
            }
        } catch (err) {
            console.error('❌ 권한 요청 중 오류:', err);
            setError('알림 권한 요청 중 오류가 발생했습니다.');
            setIsLoading(false);
            return false;
        }
    }, [messaging]);

    // 6. 토큰 삭제 (로그아웃 등)
    const clearToken = useCallback(async () => {
        try {
            if (fcmToken) {
                await deleteFCMToken();
            }
            setFcmToken(null);
            localStorage.removeItem('fcmToken');
            console.log('✅ FCM 토큰 삭제 완료');
        } catch (err) {
            console.error('FCM 토큰 삭제 오류:', err); // 에러가 나도 클라이언트는 정리
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
