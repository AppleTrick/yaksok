import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '', // 환경 변수가 설정되지 않은 경우 기본적으로 상대 경로 사용
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 5000,
});

// 토큰을 추가하기 위한 요청 인터셉터
axiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 에러 처리를 위한 응답 인터셉터
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 (Unauthorized) 또는 전역 에러를 여기서 처리
        if (error.response && error.response.status === 401) {
            // console.log('미인증 - 로그인 페이지로 리다이렉트 가능');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
