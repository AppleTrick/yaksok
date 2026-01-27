import { NextResponse } from 'next/server';

export async function GET() {
    // Mock data based on api문서.md
    const mockData = {
        success: true,
        data: {
            user: {
                email: "user@example.com",
                name: "홍길동",
                ageGroup: "THIRTY",
                gender: "MALE"
            },
            userDiseases: [
                { id: 1, name: "고혈압" }
            ],
            allDiseases: [
                { id: 1, name: "고혈압" },
                { id: 2, name: "당뇨" },
                { id: 3, name: "위염" },
                { id: 4, name: "아토피" },
                { id: 5, name: "알레르기성 비염" }
            ],
            userProducts: [
                {
                    userProductId: 5,
                    productId: 12,
                    productName: "비타민C",
                    nickname: "아침 비타민",
                    dailyDose: 1,
                    doseAmount: 1000,
                    doseUnit: "mg",
                    active: true
                }
            ]
        },
        message: null
    };

    return NextResponse.json(mockData);
}
