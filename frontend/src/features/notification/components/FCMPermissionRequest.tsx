'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useFCM } from '../hooks/useFCM';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import './FCMPermissionRequest.css';

/**
 * FCM 권한 요청 배너
 * - 조건: 로그인 상태 (설정 로드됨) AND (서버 알림 OFF OR 권한 Default)
 */
export default function FCMPermissionRequest() {
    const [isLoadingCheck, setIsLoadingCheck] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [showDeniedMessage, setShowDeniedMessage] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const { requestPermission } = useFCM();
    const { settings, isLoading: isSettingsLoading, updateActions } = useNotificationSettings();

    // 배너 노출 로직 (1. 초기 진입 & 2. 상태 변경 시)
    useEffect(() => {
        // 아직 설정(로그인 정보 포함)을 불러오는 중이면 대기
        if (isSettingsLoading) return;

        // 브라우저 환경이 아니면 중단
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setIsLoadingCheck(false);
            return;
        }

        const browserPermission = Notification.permission;
        const localGranted = localStorage.getItem('fcm_permission_granted') === 'true';

        console.log('[FCMPermissionRequest] Check:', {
            isSettingsLoading,
            pushEnabled: settings.pushEnabled, // 서버 설정
            browserPermission,
            localGranted,
            isDismissed
        });

        // 1. 이미 차단되었거나, 사용자가 '나중에'를 눌렀다면 노출 X (단, 차단 시 다른 UI가 필요할 수도 있음)
        if (isDismissed) {
            setShowBanner(false);
            setIsLoadingCheck(false);
            return;
        }

        // 2. 노출 조건
        // 조건 A: 서버 설정이 꺼져있을 때 (유저에게 켜라고 유도)
        // 조건 B: 브라우저 권한이 아직 'default'일 때 (권한 요청)
        // 단, 브라우저 권한이 'denied'면 배너 눌러도 아무일 안일어나므로(브라우저가 막음), 띄우지 않는게 나을 수 있음.
        // 하지만 여기선 "요청"을 위한 배너이므로, default이거나 granted여도 서버가 꺼져있으면 띄움.

        const shouldShow = (!settings.pushEnabled || browserPermission === 'default') && browserPermission !== 'denied';

        if (shouldShow) {
            setShowBanner(true);
        } else {
            setShowBanner(false);
        }

        setIsLoadingCheck(false);
    }, [isSettingsLoading, settings.pushEnabled, isDismissed]);


    const handleAllow = async () => {
        try {
            // FCM 권한 요청
            const isGranted = await requestPermission();

            if (isGranted) {
                // 성공 시
                localStorage.setItem('fcm_permission_granted', 'true');
                // 서버 설정도 켜줌
                await updateActions.togglePush(true);
                setShowBanner(false);
            } else {
                // 실패/거부 시
                // togglePush(false)는 필요없을 수 있으나 명시적으로
                await updateActions.togglePush(false);
                setShowBanner(false);
                setShowDeniedMessage(true); // 거부 안내 메시지
            }
        } catch (error) {
            console.error('권한 요청 실패:', error);
            setShowBanner(false);
        }
    };

    const handleDismiss = () => {
        // "나중에" -> 이번 세션(또는 앱 다시 켜기 전까지) 숨김
        setIsDismissed(true);
        setShowBanner(false);

        console.log('⏭️ 알림 권한 나중에 선택');
    };

    const handleReconsider = () => {
        // 다시 시도
        setShowDeniedMessage(false);
        handleAllow(); // 바로 권한 요청 다시 시도
    };

    if (isLoadingCheck) return null;
    if (!showBanner && !showDeniedMessage) return null;

    return (
        <>
            {/* 권한 요청 배너 */}
            {showBanner && (
                <div className="fcm-permission-request">
                    <div className="fcm-request-content">
                        <div className="fcm-request-icon">
                            <Bell size={24} color="#FF5722" />
                        </div>
                        <div className="fcm-request-text">
                            <h3>알림 권한 허용</h3>
                            <p>복용 시간을 놓치지 않으려면 알림을 켜주세요!</p>
                        </div>
                    </div>
                    <div className="fcm-request-actions">
                        <button
                            className="fcm-request-btn fcm-request-btn-dismiss"
                            onClick={handleDismiss}
                        >
                            나중에
                        </button>
                        <button
                            className="fcm-request-btn fcm-request-btn-allow"
                            onClick={handleAllow}
                        >
                            허용
                        </button>
                    </div>
                </div>
            )}

            {/* 거부 시 메시지 (ToggleSwitch와 별도로 Banner 내에서 처리 시) */}
            {showDeniedMessage && (
                <div className="fcm-denied-message">
                    <div className="fcm-denied-content">
                        <div className="fcm-denied-icon">⚠️</div>
                        <div className="fcm-denied-text">
                            <h4>알림이 차단되었습니다</h4>
                            <p>브라우저 설정에서 권한을 허용해야 알림을 받을 수 있습니다.</p>
                        </div>
                    </div>
                    <div className="fcm-denied-actions">
                        <button
                            className="fcm-denied-btn fcm-denied-btn-close"
                            onClick={() => setShowDeniedMessage(false)}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
