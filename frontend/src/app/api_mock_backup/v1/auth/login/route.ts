import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body;

  // 모의(Mock) 검증
  if (email === 'user@example.com' && password === 'password123!') {
    return NextResponse.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 1,
          name: 'Test User',
          email: 'user@example.com',
        },
      },
      message: null,
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: '이메일 또는 비밀번호가 잘못되었습니다.',
      },
    },
    { status: 401 }
  );
}
