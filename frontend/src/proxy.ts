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

    // 0. 토큰 유효성 검증 로직 전문화
    const accessToken = request.cookies.get('ACCESS_TOKEN');
    const lowerAccessToken = request.cookies.get('access_token');
    const accessTokenValue = accessToken?.value || lowerAccessToken?.value;

    const hasValidToken = accessTokenValue &&
        accessTokenValue !== 'undefined' &&
        accessTokenValue !== 'null' &&
        accessTokenValue.trim() !== '';

    // 1. API/AI 요청 프록시 (최대한 투명하게, 필요한 경우에만 보정)
    if (pathname.startsWith('/api/v1') || pathname.startsWith('/ai/v1')) {
        if (hasValidToken) {
            const requestHeaders = new Headers(request.headers);

            // Authorization 헤더가 없다면 Bearer 토큰 주입 (백엔드 호환성 강화)
            if (!requestHeaders.has('Authorization')) {
                requestHeaders.set('Authorization', `Bearer ${accessTokenValue}`);
            }

            // 백엔드가 대문자 ACCESS_TOKEN 쿠키를 선호하므로, 소문자만 있는 경우 등 보정
            let cookieHeader = requestHeaders.get('cookie') || '';
            if (!cookieHeader.includes('ACCESS_TOKEN=')) {
                cookieHeader += (cookieHeader ? '; ' : '') + `ACCESS_TOKEN=${accessTokenValue}`;
                requestHeaders.set('cookie', cookieHeader);
            }

            return NextResponse.next({
                request: {
                    headers: requestHeaders,
                },
            });
        }
        return NextResponse.next();
    }

    // 2. 페이지 접근 제어 로직
    const isProtectedRoute = pathname === '/' || protectedRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

    // 미인증 사용자가 보호된 경로 접근 시 리다이렉트
    if (isProtectedRoute && !hasValidToken) {
        const url = new URL('/login', request.url);
        return NextResponse.redirect(url);
    }

    // 인증된 사용자 혹은 '찌꺼기 쿠키'가 있는 사용자가 인증 관련 경로(/login 등) 접근 시
    if (isAuthRoute) {
        if (hasValidToken) {
            // 유효한 토큰이 있으면 홈으로
            return NextResponse.redirect(new URL('/', request.url));
        } else if (accessTokenValue) {
            // 유효하지 않은 '찌꺼기' 값이 들어있다면 쿠키를 삭제하고 진입 허용 (루프 방지)
            const response = NextResponse.next();
            response.cookies.delete('ACCESS_TOKEN');
            response.cookies.delete('access_token');
            return response;
        }
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
