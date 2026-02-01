import axiosInstance from '@/lib/axios';

// Spec: PUT /users/me/products (Note: URL starts with /users not /api/v1/user? Spec says /users/me/products. 
// "Base URL: /api/v1". So full path is /api/v1/users/me/products ?
// Or /api/v1/user/me/products?
// Spec says "5. 사용자 복용 약 수정 (분리 API) URL: /users/me/products"
// Other User APIs are "/user/info", "/user/edit".
// It is likely "/api/v1/users/me/products" or typo in Spec "/user/me/products".
// "1. 회원 / 인증 API" section shows "/user/..." (singular).
// "5. 사용자 복용 약 수정" shows "/users/..." (plural).
// I will use "/users/me/products" as per Spec literal, appended to API_BASE.
const API_BASE = '/api/v1/users/me/products';

export interface UserProductUpdateItem {
    userProductId: number;
    nickname: string;
    dailyDose: number;
    doseAmount: number;
    doseUnit: string;
    active: boolean;
}

export interface UserProductUpdateRequest {
    products: UserProductUpdateItem[];
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
}

/**
 * 사용자 복용 약 수정
 * PUT /api/v1/users/me/products
 */
export const updateUserProducts = async (data: UserProductUpdateRequest): Promise<void> => {
    // Note: Spec says Method PUT, URL /users/me/products
    // We assume /api/v1 prefix applies to all based on "Base URL: /api/v1".
    await axiosInstance.put<ApiResponse<null>>(API_BASE, data);
};
