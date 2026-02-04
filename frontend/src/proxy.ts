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

        if (accessToken && !lowerAccessToken) {
            const requestHeaders = new Headers(request.headers);
            const cookieHeader = request.cookies
                .getAll()
                .map((cookie) => `${cookie.name}=${cookie.value}`)
                .join('; ');

            const newCookieHeader = `${cookieHeader}; access_token=${accessToken.value}`;
            requestHeaders.set('cookie', newCookieHeader);

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
    }

    // 2. 페이지 접근 제어 로직
    const accessTokenValue = request.cookies.get('ACCESS_TOKEN')?.value;

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
