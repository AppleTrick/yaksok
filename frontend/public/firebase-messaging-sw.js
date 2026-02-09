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
    const now = new Date().toLocaleTimeString();
    console.warn(`[${now}] 📥 [SW] 백그라운드 메시지 도착!`, payload);

    const data = payload.data || {};

    // 제목과 본문은 data 필드에서 우선적으로 가져옴 (없으면 Fallback)
    const notificationTitle = data.title || payload.notification?.title || '💊 복약 알림';
    const notificationBody = data.body || payload.notification?.body || '영양제 드실 시간입니다.';

    // 고유 태그 생성 (번들링 대응)
    const idsStr = data.notificationIds || data.notificationId || data.id || 'unknown';
    const tag = `medication-${String(idsStr).split(',')[0]}`;

    const notificationOptions = {
        body: notificationBody,
        icon: '/icons/logo.png',
        badge: '/icons/logo.png',
        vibrate: [200, 100, 200],
        data: {
            ...data,
            url: data.url || '/',
            notificationIds: data.notificationIds || data.notificationId,
            userProductIds: data.userProductIds || data.userProductId
        },
        tag: tag,
        renotify: true,
        requireInteraction: true,
        actions: [
            // 버튼 순서 변경: 미루기(좌), 복용(우)
            { action: 'snooze', title: '⏰ 나중에 알림' },
            { action: 'complete', title: '✅ 지금 복용' }
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
        event.waitUntil(
            handleMedicationComplete(data)
                .then(() => openApp(data.url || '/dev/null'))
                .catch(err => {
                    console.error('복용 완료 처리 중 오류 발생했지만 앱은 엽니다.', err);
                    return openApp(data.url || '/');
                })
        );
    } else if (action === 'snooze') {
        event.waitUntil(handleMedicationSnooze(data));
    } else {
        event.waitUntil(openApp(data.url || '/'));
    }
});

// 앱 열기 헬퍼 함수
async function openApp(url) {
    if (url === '/dev/null') return;
    const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
        }
    }
    if (clients.openWindow) return clients.openWindow(url);
}

// 1. 복용 완료 API 호출 (다중 ID 및 실제 복약 로그 지원)
async function handleMedicationComplete(data) {
    const ids = String(data.notificationIds || data.notificationId || data.id).split(',');
    const productIds = String(data.userProductIds || data.userProductId || '').split(',').filter(Boolean);

    const notificationEndpoint = `${self.location.origin}/api/v1/notification/taken`;
    const intakeEndpoint = `${self.location.origin}/api/v1/intakes/check`;

    console.log(`[SW] 다중 복용 처리 시작: 알림 ${ids.length}건, 영양제 ${productIds.length}건`, { ids, productIds });

    try {
        // A. 모든 알림 레코드를 '확인됨'으로 마킹
        await Promise.all(ids.map(id =>
            fetch(notificationEndpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ notificationId: Number(id) })
            }).then(res => {
                if (!res.ok) throw new Error(`알림 ${id} 처리 실패: ${res.status}`);
                return res;
            })
        ));

        // [수정됨] intakes/check (토글) 호출 제거 - Notification.intaken만 true로 설정하면 충분함.
        console.log('✅ [SW] 모든 알림 복용 처리 성공');

        const channel = new BroadcastChannel('pill_channel');
        channel.postMessage({
            type: 'PILL_TAKEN_COMPLETE',
            notificationIds: ids,
            action: 'complete',
            timestamp: Date.now()
        });
        channel.close();
    } catch (error) {
        console.error('❌ [SW] 복용 처리 실패:', error);
    }
}

// 2. 나중에 알림 (Snooze) API 호출 (다중 ID 지원)
async function handleMedicationSnooze(data) {
    const ids = String(data.notificationIds || data.notificationId || data.id).split(',');
    const endpoint = `${self.location.origin}/api/v1/notification/snooze`;

    console.log(`[SW] 다중 미루기 처리 시작: ${ids.length}건`, ids);

    try {
        await Promise.all(ids.map(id =>
            fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ notificationId: Number(id) })
            }).then(res => {
                if (!res.ok) throw new Error(`ID ${id} 미루기 실패: ${res.status}`);
                return res;
            })
        ));

        console.log('✅ [SW] 모든 알림 미루기 성공');

        const channel = new BroadcastChannel('pill_channel');
        channel.postMessage({
            type: 'PILL_SNOOZE_COMPLETE',
            notificationIds: ids,
            action: 'snooze',
            timestamp: Date.now()
        });
        channel.close();
    } catch (error) {
        console.error('❌ [SW] 재알림 요청 실패:', error);
    }
}

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
