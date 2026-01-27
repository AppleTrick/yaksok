import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: '', // API 프록시를 사용하기 위해 빈 문자열로 고정 (환경변수 무시)
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // 쿠키 포함 요청 설정
    timeout: 5000,
});

// 토큰 관련 요청 인터셉터 제거 (쿠키 기반 인증 사용)
axiosInstance.interceptors.request.use(
    (config) => {
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
