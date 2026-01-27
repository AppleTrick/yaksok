import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    const body = await request.json();
    console.log('Mock Password Change Request:', body);

    // Simple validation simulation
    if (!body.currentPassword || !body.newPassword) {
        return NextResponse.json({
            success: false,
            error: { code: 'INVALID_INPUT', message: '필수 입력값이 누락되었습니다.' }
        }, { status: 400 });
    }

    return NextResponse.json({
        success: true,
        data: null,
        message: "비밀번호가 성공적으로 변경되었습니다."
    });
}
