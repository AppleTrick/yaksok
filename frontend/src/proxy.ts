import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
    // /api/v1 경로로 가는 요청에 대해서만 동작
    if (request.nextUrl.pathname.startsWith('/api/v1')) {

        // 1. 백엔드가 설정한 대문자 쿠키 가져오기
        const accessToken = request.cookies.get('ACCESS_TOKEN');
        // 2. 백엔드가 검증하려는 소문자 쿠키 확인
        const lowerAccessToken = request.cookies.get('access_token');

        // 3. 대문자는 있는데 소문자가 없으면 복제해서 헤더에 추가
        if (accessToken && !lowerAccessToken) {

            const requestHeaders = new Headers(request.headers);

            // 기존 쿠키 문자열을 가져와서 새 쿠키를 덧붙임
            const cookieHeader = request.cookies
                .getAll()
                .map((cookie) => `${cookie.name}=${cookie.value}`)
                .join('; ');

            // access_token 추가
            const newCookieHeader = `${cookieHeader}; access_token=${accessToken.value}`;

            requestHeaders.set('cookie', newCookieHeader);

            // 변경된 헤더를 포함하여 다음 단계로 진행
            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    return NextResponse.next();
}

// 미들웨어 적용 경로
export const config = {
    matcher: '/api/v1/:path*',
};
