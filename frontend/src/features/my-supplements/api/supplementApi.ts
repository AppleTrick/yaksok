import axiosInstance from '@/lib/axios';

// --- Base URLs ---
const USER_PRODUCTS_BASE = '/api/v1/users/me/products';
const SUPPLEMENTS_BASE = '/api/v1/supplements';
const INTAKES_BASE = '/api/v1/intakes';

// --- Common Types ---

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string | null;
}

// --- 1. 사용자 복용 약 수정 ---

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

/**
 * 사용자 복용 약 수정
 * PUT /api/v1/users/me/products
 */
export const updateUserProducts = async (data: UserProductUpdateRequest): Promise<void> => {
    await axiosInstance.put<ApiResponse<null>>(USER_PRODUCTS_BASE, data);
};

// --- 2. 영양제 스캔 & 분석 ---

export interface IngredientInfo {
    ingredientId: number;
    ingredientName: string;
    amount: number;
    unit: string;
}

export interface ScannedProduct {
    productId: number;
    productName: string;
    ingredients: IngredientInfo[];
}

export interface InteractionItem {
    withProductId: number;
    withProductName: string;
    ingredients: string[];
    type: 'CAUTION' | 'WARNING' | 'SAFE';
    message: string;
}

export interface InteractionAnalysis {
    interactions: InteractionItem[];
}

export interface OverdoseItem {
    ingredientId: number;
    ingredientName: string;
    currentTotal?: number;
    expectedTotal?: number;
    recommendedMax: number;
    unit: string;
    overdose: boolean;
}

export interface OverdoseAnalysis {
    currentIntake: OverdoseItem[];
    afterTakingScannedProduct: OverdoseItem[];
}

export interface SupplementScanResponse {
    scannedProduct: ScannedProduct;
    interactionAnalysis: InteractionAnalysis;
    overdoseAnalysis: OverdoseAnalysis;
}

/**
 * 약통 이미지 스캔 & 종합 분석
 * POST /api/v1/supplements/scan
 */
export const scanSupplement = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post<ApiResponse<SupplementScanResponse>>(
        `${SUPPLEMENTS_BASE}/scan`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
};

// --- 3. 영양제 검색 ---

export interface SupplementSearchResult {
    supplementId: number;
    productName: string;
}

export interface SupplementSearchResponse {
    results: SupplementSearchResult[];
}

/**
 * 유사도 검색
 * GET /api/v1/supplements/search?keyword={keyword}
 */
export const searchSupplements = async (keyword: string) => {
    const response = await axiosInstance.get<ApiResponse<SupplementSearchResponse>>(
        `${SUPPLEMENTS_BASE}/search`,
        {
            params: { keyword },
        }
    );
    return response.data;
};

// --- 4. 영양제 수동 등록 ---

export interface ManualIngredient {
    name: string;
    amount: number;
    unit: string;
}

export interface ManualSupplementRequest {
    productName: string;
    ingredients: ManualIngredient[];
}

/**
 * 영양제 수동 등록
 * POST /api/v1/supplements
 */
export const registerSupplementManually = async (data: ManualSupplementRequest) => {
    const response = await axiosInstance.post<ApiResponse<null>>(`${SUPPLEMENTS_BASE}`, data);
    return response.data;
};

// --- 5. 복용 기록 ---

export interface IntakeCheckRequest {
    supplementId: number;
}

/**
 * Zero-Step 복용 체크
 * POST /api/v1/intakes/check
 */
export const checkIntake = async (supplementId: number) => {
    const response = await axiosInstance.post<ApiResponse<null>>(`${INTAKES_BASE}/check`, {
        supplementId,
    });
    return response.data;
};

export interface TodayIntakeItem {
    supplementId: number;
    productName: string;
    taken: boolean;
}

export interface TodayIntakeResponse {
    intakes: TodayIntakeItem[];
}

/**
 * 오늘 복용 목록 조회
 * GET /api/v1/intakes/today
 */
export const getTodayIntakes = async () => {
    const response = await axiosInstance.get<ApiResponse<TodayIntakeResponse>>(`${INTAKES_BASE}/today`);
    return response.data;
};
