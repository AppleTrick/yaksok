import axios from '@/lib/axios';

export interface UserInfo {
    name: string;
    ageGroup?: string;
    gender?: string;
    // 추후 사용 가능한 필드가 생기면 추가
}

export interface UserUpdateData {
    name: string;
    ageGroup?: string;
    gender?: string;
}

export const fetchUserInfo = async (): Promise<UserInfo | null> => {
    try {
        const response = await axios.get('/api/v1/user/me');
        if (response.status === 200 && response.data.success) {
            return response.data.data;
        }
    } catch (error) {
        console.error("사용자 정보를 가져오는 데 실패했습니다:", error);
    }
    return null;
};

export const updateUserInfo = async (data: UserUpdateData): Promise<boolean> => {
    try {
        const response = await axios.put('/api/v1/user/me', data);
        if (response.status === 200 && response.data.success) {
            return true;
        }
    } catch (error) {
        console.error("사용자 정보 수정 실패:", error);
    }
    return false;
};
