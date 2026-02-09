import axiosInstance from 'axios';

const API_BASE = '/api/v1/intakes';

export interface TodayIntake {
    userProductId: number;
    productId: number | null;
    productName: string | null;
    nickname: string | null;
    dailyDose: number | null;
    doseAmount: number | null;
    doseUnit: string | null;
    ingredients?: string | null; // Add if backend supports
    cautions?: string | null;    // Add if backend supports
    taken: boolean;
}

// Common API Response Wrapper (assuming standard wrapper is used, check backend spec)
// Spec for these doesn't explicitly show 'success: true' wrapper in the "example", 
// but "Common Response Format" says "success: true, data: {}, message: null".
// So we should unwrap .data.data or .data depending on usage.
// Let's assume the standard wrapper applies to everything.
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
}

/**
 * 복용 체크 API
 * POST /api/v1/intakes/check
 * @param supplementId - 영양제 ID
 */
export const checkIntake = async (supplementId: number): Promise<void> => {
    // Spec doesn't specify response body for check, usually void or success.
    await axiosInstance.post(`${API_BASE}/check`, { supplementId });
};

/**
 * 오늘 복용 목록 조회 API
 * GET /api/v1/intakes/today
 * @returns 오늘 복용해야 할 영양제 목록
 */
export const getTodayIntakes = async (): Promise<TodayIntake[]> => {
    const response = await axiosInstance.get<ApiResponse<TodayIntake | TodayIntake[]>>(`${API_BASE}/today`);

    // Handle case where it might be wrapped or not, based on "Common Rules".
    // Spec says "Common Response Format: success, data, message".
    // So response.data is the wrapper. response.data.data is the payload.
    // The payload should be an array.
    const data = response.data.data;
    if (Array.isArray(data)) {
        return data;
    } else if (data) {
        // If single object returned (unlikely for list but just in case)
        return [data as TodayIntake];
    }
    return [];
};
