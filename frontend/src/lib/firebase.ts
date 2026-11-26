import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

/**
 * 웹용 Firebase 값은 브라우저에 그대로 내려가는 공개 식별자다 (비밀이 아님).
 * 운영 빌드에 값이 전달되지 않아 모든 화면에서 초기화가 실패했으므로,
 * 서비스 워커(public/firebase-messaging-sw.js)가 쓰는 것과 같은 값을 기본으로 둔다.
 */
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCw_pPWGmQn7HvAHOjU33TS4a17C8IZhOM',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'yak-sok-2724e.firebaseapp.com',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'yak-sok-2724e',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'yak-sok-2724e.firebasestorage.app',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '260429494',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:260429494:web:c5079f51b0ed2cbfb9b817',
};

/** 토큰을 받으려면 VAPID 공개 키가 꼭 필요하다. 빌드할 때 NEXT_PUBLIC_FIREBASE_VAPID_KEY로 넣는다. */
export const pushConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY);

let app: FirebaseApp | undefined;
const firebaseApp = () => (app ??= getApps()[0] ?? initializeApp(firebaseConfig));

/**
 * Firebase Messaging 인스턴스를 가져옵니다.
 * 브라우저 환경에서만 동작하며, FCM을 지원하지 않는 환경에서는 null을 반환합니다.
 */
/**
 * Firebase Messaging 인스턴스를 가져옵니다.
 * 브라우저 환경에서만 동작하며, FCM을 지원하지 않는 환경에서는 null을 반환합니다.
 */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
    if (typeof window === 'undefined' || !pushConfigured) return null;

    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('이 브라우저는 Firebase Cloud Messaging을 지원하지 않습니다.');
            return null;
        }

        // Service Worker 등록 확인 및 처리
        if ('serviceWorker' in navigator) {
            try {
                // next-pwa가 등록한 'sw.js'를 가로채거나, 없으면 수동 등록
                const registration = await navigator.serviceWorker.getRegistration();
                if (!registration) {
                    console.log('👷 수동 서비스 워커 등록 시도...');
                    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                }
            } catch (error) {
                console.error('❌ Service Worker 등록/확인 실패:', error);
            }
        }

        return getMessaging(firebaseApp());
    } catch (error) {
        console.error('Firebase Messaging 초기화 오류:', error);
        return null;
    }
};

/**
 * FCM 토큰을 발급받습니다.
 * @param messaging - Firebase Messaging 인스턴스
 * @returns FCM 토큰 또는 null
 */
export const getFCMToken = async (messaging: Messaging): Promise<string | null> => {
    try {
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
            console.error('VAPID 키가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
            return null;
        }

        // 현재 활성화된 Service Worker Registration 가져오기
        let registration = await navigator.serviceWorker.getRegistration();

        // 만약 없다면 (극단적인 케이스), 수동 등록 시도
        if (!registration) {
            registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }

        // serviceWorkerRegistration 옵션을 명시하여 제어권 충돌 방지
        const token = await getToken(messaging, {
            vapidKey,
            serviceWorkerRegistration: registration
        });

        return token;
    } catch (error) {
        console.error('FCM 토큰 발급 오류:', error);
        return null;
    }
};

export { getToken, onMessage };
export type { Messaging };
