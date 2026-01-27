import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
    const body = await request.json();
    console.log('Mock Update User Info Received:', body);

    return NextResponse.json({
        success: true,
        data: null,
        message: "회원 정보가 수정되었습니다."
    });
}
