'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useFCM } from '@/features/notification/hooks/useFCM';
import { saveFCMToken } from '@/features/notification/api/fcmApi';

export default function NotificationTestPage() {
    const { fcmToken, permission, isLoading, requestPermission } = useFCM();
    const [statusLog, setStatusLog] = useState<string[]>([]);
    const [pillList, setPillList] = useState<any[]>([]);

    useEffect(() => {
        // 1. 영양제 목록 가져오기
        fetchPillList();

        // 2. BroadcastChannel 구독 (서비스 워커로부터 성공 신호 수신)
        const channel = new BroadcastChannel('pill_channel');
        channel.onmessage = (event) => {
            const { type, notificationId, action } = event.data;
            if (type === 'PILL_TAKEN_COMPLETE') {
                addLog(`🔔 [Broadcast] 복용 완료 신호 수신! ID: ${notificationId}`);
                // 상태 즉시 업데이트 (새로고침 X)
                setPillList(prev => prev.map(pill =>
                    // notificationId와 매핑되는 pillId를 찾아야 하는데, 
                    // 여기서는 간단히 하기 위해 notificationId가 pillId라고 가정하거나, 
                    // 실제로는 알림 ID와 Pill ID가 다를 수 있으므로 재조회 로직이 안전할 수 있음.
                    // 하지만 요청사항은 "상태 즉시 업데이트"이므로, 
                    // 백엔드에서 notificationId가 무엇인지에 따라 로직이 달라짐.
                    // 여기서는 알림 전송 시 notificationId를 무엇으로 보냈느냐가 중요함.
                    // handleLocalPush에서 pillList[0].id를 notificationId로 쓴다고 했으므로,
                    // 여기서도 그대로 매칭하면 됨.
                    String(pill.productId) === String(notificationId)
                        ? { ...pill, isTaken: true }
                        : pill
                ));
            }
        };

        return () => channel.close();
    }, []);

    const fetchPillList = async () => {
        try {
            const response = await axios.get('/api/v1/products/user');
            if (response.data.success) {
                setPillList(response.data.data);
                addLog(`✅ 영양제 목록 로드 완료 (${response.data.data.length}개)`);
            }
        } catch (error) {
            console.error(error);
            addLog('❌ 영양제 목록 로드 실패');
        }
    };

    const addLog = (msg: string) => {
        setStatusLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    // 1. 토큰 전송 테스트
    const handleSendToken = async () => {
        if (!fcmToken) {
            addLog('❌ 전송할 토큰이 없습니다. 먼저 권한을 허용해주세요.');
            return;
        }

        try {
            addLog('📤 토큰 백엔드 전송 시도 중...');
            await saveFCMToken(fcmToken, 'web');
            addLog('✅ 토큰 전송 성공 (백엔드 저장 완료)');
        } catch (error) {
            console.error(error);
            addLog('❌ 토큰 전송 실패: 백엔드 에러 발생 (콘솔 확인)');
        }
    };

    // 3. 토큰 검증 테스트
    const handleVerifyToken = async () => {
        try {
            addLog('🔍 토큰 검증 요청 중...');
            const response = await fetch('/api/v1/notification/verify', { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                addLog(`✅ 토큰 검증 성공: ${JSON.stringify(data)}`);
            } else {
                addLog(`❌ 토큰 검증 실패: ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            addLog('❌ 토큰 검증 에러: ' + String(error));
        }
    };

    // 4. 테스트 알림 발송 요청
    const handleTestNotification = async () => {
        try {
            addLog('📨 테스트 알림 발송 요청 중 (백엔드)...');
            const response = await fetch('/api/v1/notification/test', { method: 'GET' });
            if (response.ok) {
                addLog('✅ 테스트 알림 요청 성공! (잠시 후 알림이 오는지 확인하세요)');
            } else {
                addLog(`❌ 테스트 알림 요청 실패: ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            addLog('❌ 테스트 알림 에러: ' + String(error));
        }
    };

    // 5. 토큰 삭제 (초기화)
    const handleDeleteToken = async () => {
        try {
            addLog('🗑️ 토큰 삭제 요청 중...');
            const response = await fetch('/api/v1/notification/token', { method: 'DELETE' });
            if (response.ok) {
                addLog('✅ 토큰 삭제 성공 (서버 상태 초기화됨)');
            } else {
                addLog(`❌ 토큰 삭제 실패: ${response.status}`);
            }
        } catch (error) {
            console.error(error);
            addLog('❌ 토큰 삭제 에러: ' + String(error));
        }
    };



    // 2. 로컬 푸시 테스트 (Service Worker 직접 호출)
    const handleLocalPush = async () => {
        if (permission !== 'granted') {
            addLog('❌ 알림 권한이 없습니다.');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            addLog('❌ 서비스 워커를 지원하지 않는 브라우저입니다.');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            addLog('🔔 로컬 알림 표시 요청...');
            console.log('Local Push Requested'); // Debug log

            await registration.showNotification('영양제 섭취 알림', {
                body: '비타민 C 섭취 시간입니다! (테스트)',
                // icon: '/icons/icon-192x192.png',
                // badge: '/icons/badge-72x72.png',
                vibrate: [200, 100, 200],
                tag: 'test-notification-' + Date.now(),
                data: {
                    notificationId: pillList.length > 0 ? pillList[0].productId : 9999, // 실제 데이터 ID 사용 (없으면 9999)
                    url: '/test/notification',
                    timestamp: Date.now()
                },
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
            } as any);

            addLog('✅ 로컬 알림 표시 완료');
        } catch (error) {
            console.error(error);
            addLog('❌ 로컬 알림 표시 실패: ' + String(error));
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>🔔 알림 시스템 테스트</h1>

            {/* 상태 패널 */}
            <div style={{ backgroundColor: '#f3f4f6', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p><strong>권한 상태:</strong> {permission}</p>
                <p><strong>FCM 토큰:</strong> {isLoading ? '로딩 중...' : (fcmToken ? '발급됨 ✅' : '없음 ❌')}</p>
                {fcmToken && (
                    <div style={{ marginTop: '5px', fontSize: '0.8rem', wordBreak: 'break-all', color: '#666' }}>
                        {fcmToken.slice(0, 20)}...
                    </div>
                )}
            </div>

            {/* 액션 버튼들 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {!fcmToken && (
                    <button
                        onClick={requestPermission}
                        style={{ padding: '12px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        알림 권한 요청 및 토큰 발급
                    </button>
                )}

                <button
                    onClick={handleSendToken}
                    disabled={!fcmToken}
                    style={{
                        padding: '12px',
                        backgroundColor: !fcmToken ? '#ccc' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: !fcmToken ? 'not-allowed' : 'pointer'
                    }}
                >
                    📤 토큰 백엔드 전송 테스트
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                        onClick={handleVerifyToken}
                        style={{ padding: '12px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        🔍 토큰 검증 (Verify)
                    </button>
                    <button
                        onClick={handleTestNotification}
                        style={{ padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        📨 테스트 알림 발송
                    </button>
                </div>

                <button
                    onClick={handleDeleteToken}
                    style={{ padding: '12px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                    🗑️ 토큰 삭제 (서버 초기화)
                </button>

                <button
                    onClick={handleLocalPush}
                    style={{ padding: '12px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                    🔔 로컬 푸시 알림 테스트 (버튼 확인용)
                </button>
            </div>

            {/* 로그 창 */}
            <div style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', height: '300px', overflowY: 'auto', backgroundColor: '#fff' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>📜 로그</h3>
                {statusLog.length === 0 ? (
                    <p style={{ color: '#ccc', textAlign: 'center', marginTop: '50px' }}>로그가 여기에 표시됩니다.</p>
                ) : (
                    statusLog.map((log, idx) => (
                        <div key={idx} style={{ fontSize: '0.9rem', marginBottom: '4px', borderBottom: '1px solid #f9f9f9', paddingBottom: '2px' }}>
                            {log}
                        </div>
                    ))
                )}
            </div>
            {/* 영양제 목록 표시 */}
            <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                <h3>💊 내 영양제 목록 (실시간 동기화 테스트)</h3>
                {pillList.length === 0 ? <p>데이터가 없습니다.</p> : (
                    <ul>
                        {pillList.map(pill => (
                            <li key={pill.productId} style={{
                                padding: '10px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                backgroundColor: pill.isTaken ? '#d1fae5' : 'transparent' // 복용 완료 시 초록색 배경
                            }}>
                                <span>{pill.productName} (ID: {pill.productId})</span>
                                <span style={{ fontWeight: 'bold', color: pill.isTaken ? 'green' : 'red' }}>
                                    {pill.isTaken ? '✅ 복용 완료' : '⏳ 미복용'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
