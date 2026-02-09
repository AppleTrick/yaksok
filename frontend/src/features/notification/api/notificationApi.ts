import axiosInstance from 'axios';

const API_BASE = '/api/v1/notification';

// --- Types (DTOs based on API Spec) ---

export type NotificationCategory = 'BEFOREMEAL' | 'AFTERMEAL' | 'BEFORESLEEP';


// 1. 알림 생성 / 수정 Request
export interface NotificationRequest {
    userProductId: number;
    intakeTime: string; // "HH:mm"
    category: NotificationCategory;
}

export interface NotificationEditRequest extends NotificationRequest {
    notificationId: number;
}

// 2. 알림 응답 (공통)
export interface NotificationResponseData {
    notificationSettingId: number;
    enable: boolean;
}

// 3. 알림 활성화 토글 응답
export interface NotificationEnableToggleResponse {
    notification_id: number;
    enable: boolean;
}

// 4. 복용 여부 토글 / 복용 처리 응답
export interface NotificationTakenResponse {
    notification_id: number;
    isTaken: boolean;
}

// 5. 전체 알림 조회 응답 Item
export interface NotificationItem {
    id: number;
    userId: number;
    userProductId: number;
    intakeTime: string; // "HH:mm"
    enabled: boolean;
    isTaken: boolean;
    category: NotificationCategory;
    createdAt: string; // ISO
}

export interface NotificationListResponse {
    notifications: NotificationItem[];
}

// 6. 특정 제품 알림 조회 응답
export interface NotificationProductResponse {
    id: number;
    userId: number;
    userProductId: number;
    intakeTime: string;
    enabled: boolean;
    category: NotificationCategory;
}

// 7. 알림 설정 (방해금지 등) Request
export interface NotificationSettingRequest {
    quietStart: string; // "HH:mm"
    quietEnd: string;   // "HH:mm"
}

export interface NotificationSettingEditRequest extends NotificationSettingRequest {
    notificationId: number;
    enabled: boolean;
}

// 8. FCM 토큰 관련
export interface FcmTokenRequest {
    fcmToken: string;
}

export interface TokenVerifyResponse {
    valid: boolean;
    message?: string;
}

// Common API Response Wrapper
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
}

// --- API Functions ---

/**
 * 1. 알림 생성
 * POST /api/v1/notification/
 */
export const createNotification = async (data: NotificationRequest) => {
    const response = await axiosInstance.post<ApiResponse<NotificationResponseData>>(`${API_BASE}/`, data);
    return response.data;
};

/**
 * 2. 알림 활성화 토글
 * PUT /api/v1/notification/enable/toggle
 */
export const toggleNotificationEnable = async (notificationId: number) => {
    const response = await axiosInstance.put<ApiResponse<NotificationEnableToggleResponse>>(`${API_BASE}/enable/toggle`, {
        notificationId,
    });
    return response.data;
};

/**
 * 3. 복용 여부 토글
 * PUT /api/v1/notification/taken/toggle
 */
export const toggleNotificationTaken = async (notificationId: number) => {
    const response = await axiosInstance.put<ApiResponse<NotificationTakenResponse>>(`${API_BASE}/taken/toggle`, {
        notificationId,
    });
    return response.data;
};

/**
 * 4. 복용 처리 (섭취 완료)
 * PUT /api/v1/notification/taken
 */
export const markNotificationTaken = async (notificationId: number) => {
    const response = await axiosInstance.put<ApiResponse<NotificationTakenResponse>>(`${API_BASE}/taken`, {
        notificationId,
    });
    return response.data;
};

/**
 * 5. 사용자 전체 알림 조회
 * GET /api/v1/notification/info
 */
export const getNotifications = async () => {
    const response = await axiosInstance.get<ApiResponse<NotificationListResponse>>(`${API_BASE}/info`);
    return response.data;
};

/**
 * 6. 특정 제품 알림 조회
 * GET /api/v1/notification/info/{userProductId}
 */
export const getNotificationByProduct = async (userProductId: number) => {
    const response = await axiosInstance.get<ApiResponse<NotificationProductResponse>>(`${API_BASE}/info/${userProductId}`);
    return response.data;
};

/**
 * 7. 알림 수정
 * PUT /api/v1/notification/
 */
export const updateNotification = async (data: NotificationEditRequest) => {
    const response = await axiosInstance.put<ApiResponse<NotificationResponseData>>(`${API_BASE}/`, data);
    return response.data;
};

/**
 * 8. 알림 미루기 (Snooze)
 * PUT /api/v1/notification/snoose
 */
export const snoozeNotification = async (notificationId: number) => {
    const response = await axiosInstance.put<ApiResponse<null>>(`${API_BASE}/snooze`, {
        notificationId,
    });
    return response.data;
};

/**
 * 9. 알림 설정 생성 (방해금지 시간 등)
 * POST /api/v1/notification/setting
 */
export const createNotificationSetting = async (data: NotificationSettingRequest) => {
    const response = await axiosInstance.post<ApiResponse<null>>(`${API_BASE}/setting`, data);
    return response.data;
};

/**
 * 10. 알림 설정 수정
 * PUT /api/v1/notification/setting
 */
export const updateNotificationSetting = async (data: NotificationSettingEditRequest) => {
    const response = await axiosInstance.put<ApiResponse<null>>(`${API_BASE}/setting`, data);
    return response.data;
};

/**
 * 11. 알림 삭제
 * DELETE /api/v1/notification/delete?notificationId={id}
 */
export const deleteNotification = async (notificationId: number) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${API_BASE}/delete`, {
        params: { notificationId },
    });
    return response.data;
};

// --- FCM Token & Notification Test APIs ---

/**
 * 12. 토큰 검증
 * GET /api/v1/notification/verify
 */
export const verifyToken = async () => {
    const response = await axiosInstance.get<ApiResponse<TokenVerifyResponse>>(`${API_BASE}/verify`);
    return response.data;
};

/**
 * 13. FCM 토큰 등록
 * POST /api/v1/notification/token
 */
export const registerFcmToken = async (fcmToken: string) => {
    const response = await axiosInstance.post<ApiResponse<null>>(`${API_BASE}/token`, {
        fcmToken,
    });
    return response.data;
};

/**
 * 14. 알림 테스트 요청
 * GET /api/v1/notification/test
 */
export const testNotification = async () => {
    const response = await axiosInstance.get<ApiResponse<null>>(`${API_BASE}/test`);
    return response.data;
};
