import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const body = await request.json();
    const { provider, oauthToken } = body;

    console.log(`[Mock API] 소셜 로그인 요청 받음: Provider=${provider}, Token=${oauthToken}`);

    // 모의 검증 (Mock Validation)
    // 실제로는 여기서 받은 oauthToken을 이용해 카카오/구글 서버에 사용자 정보를 요청해 검증해야 합니다.
    if (provider === 'KAKAO' && oauthToken) {
        return NextResponse.json({
            success: true,
            data: {
                accessToken: 'mock-jwt-access-token-kakao',
                refreshToken: 'mock-jwt-refresh-token-kakao',
                isNewUser: false, // true면 추가 정보 입력 페이지로 이동 로직 필요
                user: {
                    id: 100,
                    nickname: '카카오 유저',
                    role: 'USER',
                }
            },
            message: null,
        });
    }

    return NextResponse.json(
        {
            success: false,
            error: {
                code: 'AUTH_FAILED',
                message: '소셜 로그인 인증에 실패했습니다.',
            },
        },
        { status: 401 }
    );
}
