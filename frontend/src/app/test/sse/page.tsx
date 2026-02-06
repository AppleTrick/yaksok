'use client';

import React, { useState, useEffect } from 'react';
import AppContainer from '@/layout/AppContainer';
import { useSSE } from '@/features/notification/hooks/useSSE';

export default function SseTestPage() {
    const { isConnected, error } = useSSE();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const triggerTestNotification = async () => {
        setLoading(true);
        setResult(null);
        try {
            const response = await fetch('/api/v1/notification/test');
            if (response.ok) {
                setResult('✅ 테스트 알림 요청 성공! 잠시 후 알림이 도착하는지 확인하세요.');
            } else {
                setResult('❌ 테스트 알림 요청 실패');
            }
        } catch (err) {
            setResult('❌ 에러 발생: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SSE 알림 테스트 도구</h1>

                <div style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: isConnected ? '#e8f5e9' : '#ffebee',
                    border: `1px solid ${isConnected ? '#4caf50' : '#f44336'}`
                }}>
                    <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>연결 상태</h2>
                    <p style={{ color: isConnected ? '#2e7d32' : '#c62828', fontWeight: 'bold' }}>
                        {isConnected ? '● 연결됨' : '○ 연결 끊김'}
                    </p>
                    {error && <p style={{ color: '#c62828', fontSize: '0.875rem' }}>{error}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', color: '#666' }}>
                        아래 버튼을 누르면 서버에서 테스트 알림을 보냅니다. <br />
                        SSE가 정상적으로 연결되어 있다면 상단에 복용/미루기 팝업이 떠야 합니다.
                    </p>
                    <button
                        onClick={triggerTestNotification}
                        disabled={loading || !isConnected}
                        style={{
                            padding: '1rem',
                            backgroundColor: isConnected ? '#2196f3' : '#bdbdbd',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 'bold',
                            cursor: isConnected ? 'pointer' : 'not-allowed',
                            fontSize: '1rem'
                        }}
                    >
                        {loading ? '전송 중...' : '테스트 알림 보내기'}
                    </button>
                    {result && (
                        <p style={{
                            fontSize: '0.875rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            backgroundColor: '#f5f5f5'
                        }}>
                            {result}
                        </p>
                    )}
                </div>

                <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#999' }}>
                    <p>※ 주의: 로그인이 되어 있어야 테스트가 가능합니다.</p>
                </div>
            </div>
        </AppContainer>
    );
}
