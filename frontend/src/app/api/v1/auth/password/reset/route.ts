import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        console.log(`[Mock API] 비밀번호 재설정 요청: ${email}`);

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: '이메일을 입력해주세요.',
                    },
                },
                { status: 400 }
            );
        }

        // 이메일이 존재하지 않는 경우 시뮬레이션 (선택 사항)
        if (email === 'unknown@example.com') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'USER_NOT_FOUND',
                        message: '가입되지 않은 이메일입니다.',
                    },
                },
                { status: 404 }
            );
        }

        // 테스트 편의를 위해 고정 인증 코드 로그 출력
        console.log(`[Mock API] '${email}'로 발송된 인증 코드: 123456`);

        return NextResponse.json({
            success: true,
            data: {},
            message: '비밀번호 재설정 메일이 발송되었습니다.',
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'SERVER_ERROR',
                    message: '서버 내부 오류가 발생했습니다.',
                },
            },
            { status: 500 }
        );
    }
}
