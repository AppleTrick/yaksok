"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Check } from 'lucide-react';

import { useReportContext } from '@/features/report/contexts/ReportContext';
import '@/features/report/styles.css';

// Components
import ReportHeader from '@/features/report/components/ReportHeader';
import ProductSection from '@/features/report/components/ProductSection';
import IngredientSection from '@/features/report/components/IngredientSection';
import ComparisonSection from '@/features/report/components/ComparisonSection';
import RecommendationSection from '@/features/report/components/RecommendationSection';
import RegisterConfirmModal from '@/features/report/components/RegisterConfirmModal';

// Mock 데이터 (백엔드 API 연동 전까지 컴포넌트 전달용)
const mockRecognizedIngredients = [
    { name: '비타민 D3', amount: '1000IU', dailyPercent: 250 },
    { name: '오메가-3 (EPA)', amount: '360mg', dailyPercent: 45 },
    { name: '오메가-3 (DHA)', amount: '240mg', dailyPercent: 48 },
    { name: '비타민 E', amount: '15mg', dailyPercent: 100 },
];

const mockComparisonData = [
    { name: '비타민 D3', myAmount: '800IU', newAmount: '1000IU', totalAmount: '1800IU', status: 'warning' },
    { name: '비타민 C', myAmount: '500mg', newAmount: '0mg', totalAmount: '500mg', status: 'good' },
    { name: '오메가-3', myAmount: '0mg', newAmount: '600mg', totalAmount: '600mg', status: 'new' },
    { name: '아연', myAmount: '10mg', newAmount: '0mg', totalAmount: '10mg', status: 'good' },
];

const mockRecommendationData = {
    interactions: [
        { type: 'warning' as const, text: '비타민 E와 오메가-3를 함께 고용량 복용 시 혈액 응고에 영향을 줄 수 있습니다.' },
        { type: 'tip' as const, text: '비타민 D는 지용성이므로 식사와 함께 복용하면 흡수율이 높아집니다.' },
    ],
    dosageInfo: [
        { name: '비타민 D3', min: '400IU', recommended: '800IU', max: '4000IU', current: '1800IU', status: 'good' as const },
        { name: '오메가-3', min: '250mg', recommended: '500mg', max: '3000mg', current: '600mg', status: 'good' as const },
    ],
    productNotes: [
        '이 제품은 식후 복용을 권장합니다.',
        '임산부는 복용 전 전문가와 상담하세요.',
    ]
};

export default function ReportPage() {
    const router = useRouter();
    const { reportData, clearReportData } = useReportContext();
    const [showRegisterModal, setShowRegisterModal] = useState(false);

    const handleBack = () => {
        clearReportData();
        router.push('/camera');
    };

    const handleConfirmRegister = () => {
        // 실제 등록 로직이 들어갈 자리
        setShowRegisterModal(false);
        clearReportData();
        router.push('/my-supplements');
        // alert는 사용자 경험을 위해 추후 토스트나 다른 방식으로 교체 가능
    };

    const handleCancelRegister = () => {
        setShowRegisterModal(false);
        clearReportData();
        router.push('/camera');
    };

    // 분석된 제품 정보
    const products = reportData.analysisResult?.frontend_data?.products || [];

    return (
        <div className="report-container">
            <ReportHeader
                onBack={handleBack}
                title="영양제 리포트"
                subtitle="분석된 정보를 확인하고 관리해보세요"
            />

            <main className="report-content-scroll">
                {/* 1. 인식된 영양제 섹션 */}
                <ProductSection products={products} />

                {/* 2. 인식된 성분 섹션 */}
                <IngredientSection ingredients={mockRecognizedIngredients} />

                {/* 3. 기존 영양제 비교 섹션 */}
                <ComparisonSection comparisonData={mockComparisonData} />

                {/* 4. 섭취 권장사항 섹션 */}
                <RecommendationSection
                    interactions={mockRecommendationData.interactions}
                    dosageInfo={mockRecommendationData.dosageInfo}
                    productNotes={mockRecommendationData.productNotes}
                />

                {/* Bottom Spacer for footer */}
                <div className="report-spacer" />
            </main>

            {/* 고정 푸터 버튼 */}
            <footer className="report-footer-modern">
                <button className="footer-btn-modern secondary" onClick={handleBack}>
                    <RotateCcw size={18} />
                    다시 촬영
                </button>
                <button className="footer-btn-modern primary" onClick={() => setShowRegisterModal(true)}>
                    내 리스트에 추가
                    <Check size={18} />
                </button>
            </footer>

            {/* 프리미엄 등록 모달 */}
            <RegisterConfirmModal
                isOpen={showRegisterModal}
                products={products}
                onConfirm={handleConfirmRegister}
                onCancel={handleCancelRegister}
                onClose={() => setShowRegisterModal(false)}
            />
        </div>
    );
}
