// Firebase SDK 임포트 (CDN 사용)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase 설정
firebase.initializeApp({
    apiKey: "AIzaSyCw_pPWGmQn7HvAHOjU33TS4a17C8IZhOM",
    authDomain: "yak-sok-2724e.firebaseapp.com",
    projectId: "yak-sok-2724e",
    storageBucket: "yak-sok-2724e.firebasestorage.app",
    messagingSenderId: "260429494",
    appId: "1:260429494:web:c5079f51b0ed2cbfb9b817",
    measurementId: "G-9M742YT7VC"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 (브라우저가 백그라운드일 때)
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] 백그라운드 메시지 수신:', payload);

    // 알림 데이터 파싱
    const data = payload.data || {};
    const notificationTitle = payload.notification?.title || data.title || '💊 복용 시간이에요!';
    const notificationBody = payload.notification?.body || data.body || '영양제 드실 시간입니다.';

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            ...data,
            url: data.url || '/',
            notificationId: data.notificationId, // 백엔드에서 전달하는 알림 ID
            userProductId: data.userProductId,
            productName: data.productName,
        },
        tag: `medication-${data.notificationId || Date.now()}`,
        requireInteraction: true, // 사용자가 직접 닫을 때까지 유지
        actions: [
            {
                action: 'complete',
                title: '✅ 복용 완료',
                icon: '/icons/check-icon.png'
            },
            {
                action: 'snooze',
                title: '⏰ 나중에 알림',
                icon: '/icons/snooze-icon.png'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] 알림 클릭:', event);
    console.log('액션:', event.action);
    console.log('데이터:', event.notification.data);

    event.notification.close();

    const data = event.notification.data || {};
    const action = event.action;

    if (action === 'complete') {
        // 복용 완료 처리
        event.waitUntil(
            handleMedicationComplete(data).then(() => {
                // 앱 열기
                return openApp(data.url || '/');
            })
        );
    } else if (action === 'snooze') {
        // 나중에 알림 (5분 후 재알림 요청)
        event.waitUntil(
            handleMedicationSnooze(data).then(() => {
                console.log('5분 후 재알림 예약됨');
            })
        );
    } else {
        // 알림 본문 클릭 시 앱 열기
        event.waitUntil(openApp(data.url || '/'));
    }
});

// 앱 열기 헬퍼 함수
async function openApp(url) {
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });

    // 이미 열려있는 탭이 있으면 포커스
    for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
        }
    }

    // 열려있는 탭이 없으면 새 창 열기
    if (clients.openWindow) {
        return clients.openWindow(url);
    }
}

// 복용 완료 처리
async function handleMedicationComplete(data) {
    console.log('복용 완료 처리:', data);

    try {
        // 백엔드 API 호출 (복용 완료 기록)
        const response = await fetch(`${self.location.origin}/api/v1/notification/taken`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notificationId: data.notificationId,
            }),
        });

        if (response.ok) {
            console.log('복용 완료 기록 성공');
        } else {
            console.error('복용 완료 기록 실패:', response.status);
        }
    } catch (error) {
        console.error('복용 완료 처리 에러:', error);
    }
}

// 나중에 알림 처리
async function handleMedicationSnooze(data) {
    console.log('나중에 알림 처리:', data);

    try {
        // 백엔드 API 호출 (5분 후 재알림 요청)
        const response = await fetch(`${self.location.origin}/api/v1/notification/snooze`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                notificationId: data.notificationId,
            }),
        });

        if (response.ok) {
            console.log('재알림 예약 성공');
        } else {
            console.error('재알림 예약 실패:', response.status);
        }
    } catch (error) {
        console.error('재알림 처리 에러:', error);
    }
}


// Service Worker 설치 이벤트
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker 설치됨');
    self.skipWaiting();
});

// Service Worker 활성화 이벤트
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker 활성화됨');
    event.waitUntil(clients.claim());
});
