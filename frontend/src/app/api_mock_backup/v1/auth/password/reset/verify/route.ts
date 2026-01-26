import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, code } = body;

        console.log(`[Mock API] 인증 코드 확인 요청: 이메일=${email}, 코드=${code}`);

        if (!email || !code) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: '이메일과 인증 코드를 모두 입력해주세요.',
                    },
                },
                { status: 400 }
            );
        }

        // 인증 코드 검증 시뮬레이션 (예: '123456'만 통과)
        if (code !== '123456') {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_CODE',
                        message: '인증 코드가 올바르지 않습니다.',
                    },
                },
                { status: 400 } // 또는 401
            );
        }

        return NextResponse.json({
            success: true,
            data: {},
            message: '인증에 성공했습니다.',
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
