import axios from 'axios';

export interface Disease {
    id: number;
    sickName: string;
}

export interface UserProduct {
    userProductId: number;
    productId: number;
    productName: string;
    nickname: string;
    dailyDose: number;
    doseAmount: number;
    doseUnit: string;
    active: boolean;
}

export interface UserName {
    name: string;
}

export interface UserInfo {
    userDataResponse: {
        email: string;
        name: string;
        ageGroup: string;
        gender: string;
    };
    userDiseases: Disease[];
    allDiseases: Disease[];
    userProducts: UserProduct[];
}

export interface UserUpdateData {
    name: string;
    ageGroup: string;
    gender: string;
    diseaseIds: number[];
}

export const fetchUserName = async (): Promise<UserName | null> => {
    try {
        const response = await axios.get('/api/v1/user/me');
        if (response.status === 200 && response.data.success) {
            return response.data.data;
        }
    } catch (error) {
        console.error("사용자 이름을 가져오는 데 실패했습니다:", error);
    }
    return null;
};

export const fetchUserInfo = async (): Promise<UserInfo | null> => {
    try {
        const response = await axios.get('/api/v1/user/info');
        if (response.status === 200 && response.data.success) {
            return response.data.data;
        }
    } catch (error) {
        console.error("사용자 정보를 가져오는 데 실패했습니다:", error);
    }
    return null;
};

export const updateUserInfo = async (data: UserUpdateData): Promise<boolean> => {
    // try {
    //     const response = await axios.put('/api/v1/user/info', data);
    //     if (response.status === 200 && response.data.success) {
    //         return true;
    //     }
    // } catch (error) {
    //     console.error("사용자 정보 수정 실패:", error);
    // }
    return false;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await axios.put('/api/v1/user/password', { currentPassword, newPassword });
        if (response.status === 200 && response.data.success) {
            return true;
        }
    } catch (error) {
        console.error("비밀번호 변경 실패:", error);
    }
    return false;
};

export const withdrawUser = async (): Promise<boolean> => {
    try {
        const response = await axios.delete('/api/v1/user/me');
        if (response.status === 200 && response.data.success) {
            return true;
        }
    } catch (error) {
        console.error("회원 탈퇴 실패:", error);
    }
    return false;
};

export const logout = async (): Promise<boolean> => {
    try {
        const response = await axios.get('/api/v1/auth/logout');
        if (response.status === 200 && response.data.success) {
            return true;
        }
    } catch (error) {
        console.error("로그아웃 실패:", error);
    }
    return false;
};
