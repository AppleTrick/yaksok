import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, gender, ageGroup } = body;

        console.log(`[Mock API] 회원가입 요청: ${email}, ${name}`);

        // 필수 필드 검증
        if (!email || !password || !name || !gender || !ageGroup) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'INVALID_INPUT',
                        message: '모든 필드를 입력해야 합니다.',
                    },
                },
                { status: 400 }
            );
        }

        // 중복 이메일 시뮬레이션
        // 이메일에 'duplicate'가 포함되어 있으면 중복 에러 반환
        if (email.includes('duplicate')) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'EMAIL_DUPLICATE',
                        message: '이미 존재하는 이메일입니다.',
                    },
                },
                { status: 409 }
            );
        }

        // 성공 응답
        return NextResponse.json(
            {
                success: true,
                data: {
                    userId: Math.floor(Math.random() * 1000),
                    email,
                    name,
                },
                message: '회원가입이 완료되었습니다.',
            },
            { status: 201 }
        );
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
