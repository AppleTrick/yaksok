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

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('ACCESS_TOKEN')?.value;

    // 1. 보호된 경로 접근 제어
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute && !accessToken) {
        const url = new URL('/login', request.url);
        // 원래 가려던 경로를 쿼리 파라미터로 넘겨줄 수도 있습니다.
        // url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
    }

    // 2. 인증된 사용자 인증 경로 접근 제어
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    if (isAuthRoute && accessToken) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

// 미들웨어가 적용될 경로 설정
export const config = {
    matcher: [
        /*
         * 다음 경로를 제외한 모든 경로에 미들웨어 적용:
         * - api (API 라우트)
         * - _next/static (정적 파일)
         * - _next/image (이미지 최적화 파일)
         * - favicon.ico (파비콘)
         * - manifests, robots.txt 등 정적 에셋
         */
        '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|images).*)',
    ],
};
