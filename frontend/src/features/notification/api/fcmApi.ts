import axiosInstance from 'axios';

/**
 * FCM 토큰을 백엔드에 저장합니다.
 * @param token - FCM 토큰
 * @param deviceType - 디바이스 타입 ('web' | 'android' | 'ios')
 */
export async function saveFCMToken(token: string, deviceType: 'web' | 'android' | 'ios' = 'web') {
    const DEVICE_TYPE_MAP = {
        'web': 'WEB',
        'android': 'ANDROID',
        'ios': 'IOS'
    };

    const payload = {
        fcmToken: token,
        deviceType: DEVICE_TYPE_MAP[deviceType]
    };

    try {
        console.log('📤 FCM 토큰 전송 Payload:', payload);
        const response = await axiosInstance.post('/api/v1/notification/token', payload);
        console.log('FCM 토큰 저장 완료:', token);
        return response.data;
    } catch (error: any) {
        // [임시 조치] 백엔드 수정 전까지 중복 키 에러(500) 또는 Conflict(409) 무시
        if (error.response && (error.response.status === 500 || error.response.status === 409)) {
            console.warn('⚠️ FCM 토큰이 이미 존재합니다. (백엔드 중복 에러 임시 무시)');
            return null; // 에러를 던지지 않고 정상 종료 처리
        }

        if (error.response) {
            console.error('❌ FCM 토큰 저장 서버 에러:', error.response.status, error.response.data);
        } else {
            console.error('❌ FCM 토큰 저장 네트워크/기타 에러:', error);
        }
        throw error;
    }
}

/**
 * 백엔드에 저장된 FCM 토큰을 삭제합니다.
 */
export async function deleteFCMToken() {
    try {
        const response = await axiosInstance.delete('/api/v1/notification/token');
        console.log('FCM 토큰 삭제 완료');
        return response.data;
    } catch (error) {
        console.error('FCM 토큰 삭제 실패:', error);
        throw error;
    }
}

/**
 * 테스트용 푸시 알림을 전송합니다. (개발 환경에서만 사용)
 */
export async function sendTestNotification() {
    try {
        const response = await axiosInstance.get('/api/v1/notification/test');
        console.log('테스트 알림 전송 요청 완료');
        return response.data;
    } catch (error) {
        console.error('테스트 알림 전송 실패:', error);
        throw error;
    }
}

/**
 * FCM 토큰 확인
 */
export async function verifyFCMToken() {
    try {
        const response = await axiosInstance.get('/api/v1/notification/verify');
        console.log('FCM 토큰 확인 완료:', response.data);
        return response.data;
    } catch (error) {
        console.error('FCM 토큰 확인 실패:', error);
        throw error;
    }
}
