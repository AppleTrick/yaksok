import axios from 'axios';

interface LoginResponse {
    success: boolean;
    data?: {
        accessToken: string;
        refreshToken: string;
    };
    error?: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axios.post('/api/v1/auth/login', { email, password });

        // Axios handles 200-299 as success
        // Assuming backend returns { success: true, data: { ... } }
        // or just the token data. Adjust based on actual backend response.
        // For now, assuming standard wrapper.

        // If the backend returns raw tokens or different structure, we might need to adjust.
        // Based on signup, it seems to use a wrapper.
        return {
            success: true,
            data: response.data
        };
    } catch (error: any) {
        console.error('Login service error:', error);
        return {
            success: false,
            error: error.response?.data?.message || '로그인 요청 중 오류가 발생했습니다.'
        };
    }
};
