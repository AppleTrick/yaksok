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

    // 알림 데이터 파싱 (Data-Only 메시지 대응)
    // 백엔드에서 notification 필드 없이 data 필드만 보내야 함
    const data = payload.data || {};

    // 제목과 본문은 data 필드에서 우선적으로 가져옴 (없으면 Fallback)
    const notificationTitle = data.title || payload.notification?.title || '💊 복용 시간이에요!';
    const notificationBody = data.body || payload.notification?.body || '영양제 드실 시간입니다.';

    // 고유 태그 생성 (notificationId + timestamp)
    // timestamp가 없으면 현재 시간 사용. 이를 통해 동일 알림도 덮어쓰지 않고 쌓이게 할 수 있음.
    // 단, 너무 많이 쌓이면 사용자 경험에 좋지 않으므로 정책에 따라 결정.
    // 여기서는 알림 유실 방지를 위해 timestamp를 포함하여 유니크하게 설정.
    const timestamp = data.timestamp || Date.now();
    const uniqueTag = `medication-${data.notificationId}-${timestamp}`;

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
        tag: uniqueTag, // 고유 태그 설정
        renotify: true, // 태그가 같더라도(혹은 갱신되더라도) 다시 알림(진동/소리) 발생
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
        // 백엔드 API 호출 (5분 후 재알림 요청) - 오타 수정: snoose -> snooze
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
