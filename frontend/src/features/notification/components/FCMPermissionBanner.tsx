'use client';

import { useFCM } from '../hooks/useFCM';
import { useEffect, useState } from 'react';
import './FCMPermissionBanner.css';

/**
 * FCM 알림 권한 요청 배너 컴포넌트
 * 사용자가 알림 권한을 허용하지 않았을 때 표시됩니다.
 */
export default function FCMPermissionBanner() {
    const { isSupported, requestPermission, isLoading, error, permission } = useFCM();
    const [showBanner, setShowBanner] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // 브라우저가 알림을 지원하고, 권한이 아직 요청되지 않았을 때만 배너 표시
        if (
            isSupported &&
            permission === 'default' &&
            !isDismissed
        ) {
            setShowBanner(true);
        } else {
            setShowBanner(false);
        }
    }, [isSupported, permission, isDismissed]);

    const handleRequestPermission = async () => {
        await requestPermission();
        setShowBanner(false);
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        setShowBanner(false);
    };

    if (!showBanner) return null;

    return (
        <div className="fcm-permission-banner">
            <div className="fcm-permission-content">
                <div className="fcm-permission-icon">🔔</div>
                <div className="fcm-permission-text">
                    <h3>알림 받기</h3>
                    <p>약 복용 시간을 놓치지 않도록 알림을 받아보세요!</p>
                    {error && <p className="fcm-permission-error">{error}</p>}
                </div>
                <div className="fcm-permission-actions">
                    <button
                        className="fcm-permission-btn fcm-permission-btn-primary"
                        onClick={handleRequestPermission}
                        disabled={isLoading}
                    >
                        {isLoading ? '설정 중...' : '알림 허용'}
                    </button>
                    <button
                        className="fcm-permission-btn fcm-permission-btn-secondary"
                        onClick={handleDismiss}
                    >
                        나중에
                    </button>
                </div>
            </div>
        </div>
    );
}
