import axios from '@/lib/axios';

export interface UserInfo {
    name: string;
    // 추후 사용 가능한 필드가 생기면 추가
}

export const fetchUserInfo = async (): Promise<UserInfo | null> => {
    try {
        const response = await axios.get('/api/v1/users/me');
        if (response.status === 200 && response.data.success) {
            return response.data.data;
        }
    } catch (error) {
        console.error("사용자 정보를 가져오는 데 실패했습니다:", error);
    }
    return null;
};
