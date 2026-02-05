import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 보호된 경로 목록
const protectedRoutes = [
    '/camera',
    '/mypage',
    '/settings',
    '/my-supplements',
    '/reminders',
    '/report'
];

// 인증 관련 경로 (로그인된 사용자 접근 제한)
const authRoutes = [
    '/login',
    '/signup',
    '/find-password'
];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. API 요청 프록시 로직 (기존 쿠키 매핑 기능)
    if (pathname.startsWith('/api/v1')) {
        const accessToken = request.cookies.get('ACCESS_TOKEN');
        const lowerAccessToken = request.cookies.get('access_token');

        // 둘 중 하나라도 있다면, 백엔드가 기대하는 형식으로 정규화
        if (accessToken || lowerAccessToken) {
            const tokenValue = accessToken?.value || lowerAccessToken?.value;
            const requestHeaders = new Headers(request.headers);

            // 기존 쿠키들을 가져오되, 백엔드가 명확히 인식할 수 있도록 ACCESS_TOKEN 주입
            const cookieHeader = request.cookies
                .getAll()
                .filter(c => c.name !== 'ACCESS_TOKEN' && c.name !== 'access_token') // 기존 토큰 제거
                .map((cookie) => `${cookie.name}=${cookie.value}`)
                .join('; ');

            const newCookieHeader = `${cookieHeader}${cookieHeader ? '; ' : ''}ACCESS_TOKEN=${tokenValue}; access_token=${tokenValue}`;
            requestHeaders.set('cookie', newCookieHeader);

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    // 2. 페이지 접근 제어 로직
    const accessTokenValue = request.cookies.get('ACCESS_TOKEN')?.value || request.cookies.get('access_token')?.value;

    // 2-1. 보호된 경로 접근 제어 (메인 페이지 '/' 및 정의된 경로들)
    const isProtectedRoute = pathname === '/' || protectedRoutes.some(route => pathname.startsWith(route));

    // 인증 관련 경로 체크 (무한 루프 방지용)
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    if (isProtectedRoute && !accessTokenValue && !isAuthRoute) {
        const url = new URL('/login', request.url);
        return NextResponse.redirect(url);
    }

    // 2-2. 인증된 사용자 인증 경로 접근 제어 (로그인/회원가입 등)
    if (isAuthRoute && accessTokenValue) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// 미들웨어(프록시) 적용 경로 설정
export const config = {
    matcher: [
        /*
         * 다음 경로를 제외한 모든 경로에 적용:
         * - _next/static (정적 파일)
         * - _next/image (이미지 최적화 파일)
         * - favicon.ico (파비콘)
         * - manifest.json 등 정적 에셋
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|images).*)',
    ],
};
