import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, newPassword } = body;

        console.log(`[Mock API] 비밀번호 변경 요청: 이메일=${email}, 새 비밀번호=${newPassword}`);

        if (!email || !newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: '필수 정보가 누락되었습니다.',
                    },
                },
                { status: 400 }
            );
        }

        // 비밀번호 복잡성 검증 시뮬레이션 (필요시 추가)
        if (newPassword.length < 8) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'WEAK_PASSWORD',
                        message: '비밀번호는 8자 이상이어야 합니다.',
                    },
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {},
            message: '비밀번호가 성공적으로 변경되었습니다.',
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
