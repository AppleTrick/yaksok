import { http, HttpResponse } from 'msw';

export const handlers = [
    // User Info Handler
    http.get('*/api/v1/user/info', () => {
        return HttpResponse.json({
            success: true,
            data: {
                user: {
                    email: 'ssafy@example.com',
                    name: '김싸피',
                    ageGroup: '20-29',
                    gender: 'MALE'
                },
                userDiseases: [
                    { id: 1, name: '고혈압' },
                    { id: 2, name: '당뇨' }
                ],
                allDiseases: [],
                userProducts: []
            }
        });
    }),

    // Password Change Handler (PUT /api/v1/user/password)
    http.put('*/api/v1/user/password', async ({ request }) => {
        const body = await request.json() as { currentPassword?: string; newPassword?: string };

        // Simulate validation error for wrong password
        if (body.currentPassword === 'wrong') {
            return HttpResponse.json(
                {
                    success: false,
                    error: {
                        code: 'AUTH_INVALID_PASSWORD',
                        message: '현재 비밀번호가 일치하지 않습니다.'
                    }
                },
                { status: 400 } // UserService checks for 200, so 400 triggers catch
            );
        }

        return HttpResponse.json(
            {
                success: true,
                data: null,
            },
            { status: 200 }
        );
    }),

    // User Withdrawal Handler (DELETE /api/v1/user/me)
    http.delete('*/api/v1/user/me', async () => {
        return HttpResponse.json(
            {
                success: true,
                data: null,
            },
            { status: 200 }
        );
    }),
];
