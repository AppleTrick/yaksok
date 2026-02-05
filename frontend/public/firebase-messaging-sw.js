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
        // icon: '/icons/icon-192x192.png',
        // badge: '/icons/badge-72x72.png',
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
                // icon: '/icons/check-icon.png'
            },
            {
                action: 'snooze',
                title: '⏰ 나중에 알림',
                // icon: '/icons/snooze-icon.png'
            }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] 알림 클릭:', event);

    // 클릭된 알림 닫기
    event.notification.close();

    const data = event.notification.data || {};
    const action = event.action;

    if (action === 'complete') {
        // [복용 완료] 버튼 클릭 시
        event.waitUntil(
            handleMedicationComplete(data)
                .then(() => openApp(data.url || '/dev/null')) // 성공 후 앱 열기 (선택)
                .catch(err => {
                    console.error('복용 완료 처리 중 오류 발생했지만 앱은 엽니다.', err);
                    return openApp(data.url || '/');
                })
        );
    } else if (action === 'snooze') {
        // [나중에 알림] 버튼 클릭 시
        event.waitUntil(
            handleMedicationSnooze(data)
        );
    } else {
        // 알림 본문 클릭 -> 앱 열기
        event.waitUntil(openApp(data.url || '/'));
    }
});

// 앱 열기 헬퍼 함수
async function openApp(url) {
    if (url === '/dev/null') return; // 특정 조건에서 앱 열기 생략 가능

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

// 1. 복용 완료 API 호출
// 1. 복용 완료 API 호출
async function handleMedicationComplete(data) {
    const endpoint = `${self.location.origin}/api/v1/notification/taken`;
    console.log(`[SW] 복용 완료 요청: PUT ${endpoint}`, data);

    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                notificationId: Number(data.notificationId),
            }),
        });

        // ✅ 개선: 응답 상세 로깅
        console.log('[SW] 응답 상태:', response.status);
        console.log('[SW] 응답 헤더:', [...response.headers.entries()]);

        if (!response.ok) {
            // ✅ 개선: JSON과 Text 모두 시도하여 정확한 에러 확인
            let errorDetails;
            const contentType = response.headers.get('content-type');

            try {
                if (contentType && contentType.includes('application/json')) {
                    errorDetails = await response.json();
                    console.error('[SW] JSON 에러 응답:', errorDetails);
                } else {
                    errorDetails = await response.text();
                    console.error('[SW] Text 에러 응답:', errorDetails);
                }
            } catch (parseError) {
                console.error('[SW] 에러 응답 파싱 실패:', parseError);
                errorDetails = '응답 파싱 불가';
            }

            throw new Error(
                `서버 응답 에러 (${response.status}): ${JSON.stringify(errorDetails)}`
            );
        }

        // ✅ 성공 응답도 로깅
        const result = await response.json();
        console.log('✅ [SW] 복용 완료 처리 성공:', result);

        const channel = new BroadcastChannel('pill_channel');
        channel.postMessage({
            type: 'PILL_TAKEN_COMPLETE',
            notificationId: data.notificationId,
            action: 'complete',
            timestamp: Date.now()
        });
        channel.close();

        // ✅ 추가: 성공 피드백 알림
        self.registration.showNotification('복용 완료', {
            body: '오늘의 복용이 기록되었습니다.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'intake-success',
            requireInteraction: false,
        });

    } catch (error) {
        console.error('❌ [SW] 복용 완료 처리 실패:', error);
        console.error('[SW] 에러 스택:', error.stack);

        // ✅ 추가: 실패 피드백 알림
        self.registration.showNotification('복용 기록 실패', {
            body: '잠시 후 다시 시도해주세요.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'intake-error',
            requireInteraction: false,
        });
    }
}

// 2. 나중에 알림 (Snooze) API 호출
// 2. 나중에 알림 (Snooze) API 호출
async function handleMedicationSnooze(data) {
    const endpoint = `${self.location.origin}/api/v1/notification/snooze`;
    console.log(`[SW] 미루기 요청: PUT ${endpoint}`, data);

    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                notificationId: Number(data.notificationId),
            }),
        });

        // ✅ 개선: 응답 상세 로깅
        console.log('[SW] 응답 상태:', response.status);
        console.log('[SW] 응답 헤더:', [...response.headers.entries()]);

        if (!response.ok) {
            // ✅ 개선: JSON과 Text 모두 시도하여 정확한 에러 확인
            let errorDetails;
            const contentType = response.headers.get('content-type');

            try {
                if (contentType && contentType.includes('application/json')) {
                    errorDetails = await response.json();
                    console.error('[SW] JSON 에러 응답:', errorDetails);
                } else {
                    errorDetails = await response.text();
                    console.error('[SW] Text 에러 응답:', errorDetails);
                }
            } catch (parseError) {
                console.error('[SW] 에러 응답 파싱 실패:', parseError);
                errorDetails = '응답 파싱 불가';
            }

            throw new Error(
                `서버 응답 에러 (${response.status}): ${JSON.stringify(errorDetails)}`
            );
        }

        // ✅ 성공 응답도 로깅
        const result = await response.json();
        console.log('✅ [SW] 재알림 예약 성공:', result);

        const channel = new BroadcastChannel('pill_channel');
        channel.postMessage({
            type: 'PILL_SNOOZE_COMPLETE',
            notificationId: data.notificationId,
            action: 'snooze',
            timestamp: Date.now()
        });
        channel.close();

        // ✅ 추가: 성공 피드백 알림
        self.registration.showNotification('알림 미루기', {
            body: '잠시 후 다시 알림드리겠습니다.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'snooze-success',
            requireInteraction: false,
        });

    } catch (error) {
        console.error('❌ [SW] 재알림 요청 실패:', error);
        console.error('[SW] 에러 스택:', error.stack);

        // ✅ 추가: 실패 피드백 알림
        self.registration.showNotification('알림 미루기 실패', {
            body: '잠시 후 다시 시도해주세요.',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: 'snooze-error',
            requireInteraction: false,
        });
    }
}

// Service Worker 설치 및 활성화
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker 설치됨');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker 활성화됨');
    event.waitUntil(clients.claim());
});
