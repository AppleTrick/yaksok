import axios from 'axios';

const axiosInstance = axios.create({
    // baseURL이 없으면 상대 경로를 사용하여 Next.js Rewrite/Middleware를 통하도록 함
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
    timeout: 10000, // 분석 등 긴 요청을 위해 10초로 연장
});

// 에러 처리를 위한 응답 인터셉터
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 (Unauthorized) 또는 전역 에러를 여기서 처리
        if (error.response && error.response.status === 401) {
            // console.log('미인증 - 로그인 페이지로 리다이렉트 가능');
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
