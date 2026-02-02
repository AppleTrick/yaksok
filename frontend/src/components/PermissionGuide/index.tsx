'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useFCM } from '@/features/notification/hooks/useFCM';
import './styles.css';

interface PermissionGuideProps {
    isOpen: boolean;
    onClose: () => void;
    onRetry: () => Promise<void>;
}

export default function PermissionGuide({ isOpen, onClose, onRetry }: PermissionGuideProps) {
    const [browser, setBrowser] = useState<string>('');
    const { requestPermission, isLoading, error } = useFCM();

    useEffect(() => {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            setBrowser('Chrome');
        } else if (userAgent.includes('Firefox')) {
            setBrowser('Firefox');
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            setBrowser('Safari');
        } else if (userAgent.includes('Edg')) {
            setBrowser('Edge');
        } else {
            setBrowser('기타');
        }
    }, []);

    const instructions: Record<string, string[]> = {
        Chrome: [
            '주소창 왼쪽의 자물쇠 아이콘을 클릭하세요',
            '"알림" 항목을 찾아 "허용"으로 변경하세요',
            '페이지를 새로고침하세요'
        ],
        Firefox: [
            '주소창 왼쪽의 자물쇠 아이콘을 클릭하세요',
            '"권한" > "알림"을 찾아 "허용"으로 변경하세요',
            '페이지를 새로고침하세요'
        ],
        Safari: [
            'Safari 메뉴 > 환경설정 > 웹사이트 > 알림으로 이동하세요',
            '현재 사이트를 찾아 "허용"으로 변경하세요',
            '페이지를 새로고침하세요'
        ],
        Edge: [
            '주소창 왼쪽의 자물쇠 아이콘을 클릭하세요',
            '"알림" 항목을 찾아 "허용"으로 변경하세요',
            '페이지를 새로고침하세요'
        ],
        기타: [
            '브라우저 설정에서 알림 권한을 허용해주세요',
            '페이지를 새로고침하세요'
        ]
    };

    const handleRetry = async () => {
        await requestPermission();
        await onRetry();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="알림 권한 안내">
            <div className="permission-guide-content">
                <p className="permission-guide-desc">
                    약 복용 알림을 받으려면 브라우저 알림 권한이 필요합니다.
                </p>

                {error && (
                    <div className="permission-error">
                        <p>{error}</p>
                    </div>
                )}

                <div className="browser-instructions">
                    <h4>{browser} 설정 방법</h4>
                    <ol>
                        {instructions[browser]?.map((step, idx) => (
                            <li key={idx}>{step}</li>
                        ))}
                    </ol>
                </div>
            </div>

            <div className="permission-guide-footer">
                <Button variant="secondary" onClick={onClose}>
                    나중에
                </Button>
                <Button variant="primary" onClick={handleRetry} disabled={isLoading}>
                    {isLoading ? '설정 중...' : '다시 시도'}
                </Button>
            </div>
        </Modal>
    );
}
