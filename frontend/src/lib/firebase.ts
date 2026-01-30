import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Firebase 앱 초기화 (중복 방지)
let app: FirebaseApp;

if (typeof window !== 'undefined') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
}

/**
 * Firebase Messaging 인스턴스를 가져옵니다.
 * 브라우저 환경에서만 동작하며, FCM을 지원하지 않는 환경에서는 null을 반환합니다.
 */
export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
    if (typeof window === 'undefined') {
        console.warn('Firebase Messaging은 브라우저 환경에서만 사용 가능합니다.');
        return null;
    }

    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn('이 브라우저는 Firebase Cloud Messaging을 지원하지 않습니다.');
            return null;
        }

        // Service Worker 등록
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('✅ Service Worker 등록 성공:', registration);
            } catch (error) {
                console.error('❌ Service Worker 등록 실패:', error);
            }
        }

        return getMessaging(app);
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

        const token = await getToken(messaging, { vapidKey });
        return token;
    } catch (error) {
        console.error('FCM 토큰 발급 오류:', error);
        return null;
    }
};

export { getToken, onMessage };
export type { Messaging };
