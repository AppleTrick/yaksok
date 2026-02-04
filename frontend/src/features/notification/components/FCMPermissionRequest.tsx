'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useFCM } from '../hooks/useFCM';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import './FCMPermissionRequest.css';

/**
 * FCM 권한 요청 배너
 * - 권한이 default일 때만 표시
 * - 허용 시: FCM 토큰 발급 + 알림 설정 자동 ON
 * - 거부 시: 재고려 유도 메시지
 */
export default function FCMPermissionRequest() {
    // 3. 로딩 상태(isLoading) 관리 최적화: 초기값을 true로 설정하여 렌더링 유보
    const [isLoadingCheck, setIsLoadingCheck] = useState(true);
    const [showBanner, setShowBanner] = useState(false);
    const [showDeniedMessage, setShowDeniedMessage] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const { requestPermission } = useFCM();
    const { updateActions } = useNotificationSettings();

    // 1. 초기 진입 시 브라우저 권한 즉시 확인 & 2. 로컬 스토리지 동기화
    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) {
            setIsLoadingCheck(false);
            return;
        }

        const browserPermission = Notification.permission;
        const localGranted = localStorage.getItem('fcm_permission_granted') === 'true';

        // 4. 디버깅 로그 추가
        console.log('[FCM Check] Status:', {
            browserPermission,
            localGranted,
            isDismissed
        });

        // 이미 허용된 상태(브라우저 OR 로컬스토리지)라면 배너 숨김
        if (browserPermission === 'granted' || localGranted) {
            setShowBanner(false);
        }
        // 권한이 default이고 사용자가 닫지 않았다면 배너 표시
        else if (browserPermission === 'default' && !isDismissed) {
            setShowBanner(true);
        } else {
            setShowBanner(false);
        }

        // 체크 완료 후 로딩 해제
        setIsLoadingCheck(false);
    }, [isDismissed]);

    const handleAllow = async () => {
        try {
            // FCM 토큰 발급 요청 (브라우저 권한 팝업 표시)
            const isGranted = await requestPermission();

            console.log('[FCM Request] Result:', isGranted);

            if (isGranted) {
                // 성공 시 로컬 스토리지에 플래그 저장
                localStorage.setItem('fcm_permission_granted', 'true');

                // 알림 설정 자동 ON
                updateActions.togglePush(true);
                setShowBanner(false);
                console.log('✅ 알림 권한 허용됨 - 푸시 알림 ON');
            } else {
                // 거부됨
                updateActions.togglePush(false);
                setShowBanner(false);
                console.log('❌ 알림 권한 거부됨 - 푸시 알림 OFF');
            }
        } catch (error) {
            console.error('권한 요청 실패:', error);
            setShowBanner(false);
        }
    };

    const handleDismiss = () => {
        // "나중에" 클릭 시 푸시 알림 OFF
        updateActions.togglePush(false);

        // 재고려 메시지 표시
        setShowBanner(false);
        setShowDeniedMessage(true);

        // 5초 후 자동 숨김
        setTimeout(() => {
            setShowDeniedMessage(false);
            setIsDismissed(true);
        }, 5000);

        console.log('⏭️ 알림 권한 나중에 - 푸시 알림 OFF');
    };

    const handleReconsider = () => {
        setShowDeniedMessage(false);
        setShowBanner(true);
    };

    // 로딩 중이거나, 표시할 배너/메시지가 없으면 렌더링 안 함
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
                            <p>영양제 복용 시간에 맞춰 알림을 보내드릴게요!</p>
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

            {/* 거부 시 재고려 메시지 */}
            {showDeniedMessage && (
                <div className="fcm-denied-message">
                    <div className="fcm-denied-content">
                        <div className="fcm-denied-icon">⚠️</div>
                        <div className="fcm-denied-text">
                            <h4>복용 알림을 못 받을 수 있습니다</h4>
                            <p>알림을 허용하면 영양제 복용 시간을 놓치지 않을 수 있어요</p>
                        </div>
                    </div>
                    <div className="fcm-denied-actions">
                        <button
                            className="fcm-denied-btn fcm-denied-btn-close"
                            onClick={() => setShowDeniedMessage(false)}
                        >
                            <X size={20} />
                        </button>
                        <button
                            className="fcm-denied-btn fcm-denied-btn-reconsider"
                            onClick={handleReconsider}
                        >
                            다시 생각해보기
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
