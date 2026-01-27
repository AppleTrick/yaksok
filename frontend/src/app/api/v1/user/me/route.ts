import { NextResponse } from 'next/server';

export async function DELETE() {
    console.log('Mock Account Withdrawal Request Received');

    return NextResponse.json({
        success: true,
        data: null,
        message: "회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다."
    });
}
