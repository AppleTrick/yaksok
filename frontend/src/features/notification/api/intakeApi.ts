const API_BASE = '/api';

export interface TodayIntake {
    supplementId: number;
    productName: string;
    taken: boolean;
}

/**
 * 복용 체크 API
 * @param supplementId - 영양제 ID
 */
export const checkIntake = async (supplementId: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/intakes/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ supplementId })
    });

    if (!response.ok) {
        throw new Error('복용 체크 실패');
    }
};

/**
 * 오늘 복용 목록 조회 API
 * @returns 오늘 복용해야 할 영양제 목록
 */
export const getTodayIntakes = async (): Promise<TodayIntake[]> => {
    const response = await fetch(`${API_BASE}/intakes/today`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('복용 목록 조회 실패');
    }

    return response.json();
};
