"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Check } from 'lucide-react';

import { useReportContext } from '@/features/report/contexts/ReportContext';
import '@/features/report/styles.css';

import { motion, Variants } from 'framer-motion';
// Components
import ReportHeader from '@/features/report/components/ReportHeader';
import ProductSection from '@/features/report/components/ProductSection';
import IngredientSection from '@/features/report/components/IngredientSection';
import ComparisonSection from '@/features/report/components/ComparisonSection';
import RecommendationSection from '@/features/report/components/RecommendationSection';
import RegisterConfirmModal from '@/features/report/components/RegisterConfirmModal';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    }
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

    // 분석된 실제 데이터 추출
    const realReportData = reportData.analysisResult?.reportData;

    // 1. 제품 목록
    const products = realReportData?.products || [];

    // 2. 성분 목록 (모든 제품의 성분을 평탄화하여 표시)
    const ingredients = products.flatMap((p: any) =>
        (p.ingredients || []).map((i: any) => ({
            name: i.name,
            amount: `${i.amount}${i.unit}`,
            dailyPercent: i.dailyPercent
        }))
    );

    // 3. 비교 및 권장 데이터
    const comparisonData = realReportData?.overdoseAnalysis?.comparison || [];
    const recommendationData = realReportData?.overdoseAnalysis?.recommendations || {
        interactions: [],
        dosageInfo: [],
        productNotes: []
    };

    return (
        <motion.div
            className="report-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <ReportHeader
                    onBack={handleBack}
                    title="영양제 리포트"
                    subtitle="분석된 정보를 확인하고 관리해보세요"
                />
            </motion.div>

            <main className="report-content-scroll">
                {/* 1. 인식된 영양제 섹션 */}
                <motion.div variants={itemVariants}>
                    <ProductSection products={products} />
                </motion.div>

                {/* 2. 인식된 성분 섹션 */}
                <motion.div variants={itemVariants}>
                    <IngredientSection ingredients={ingredients} />
                </motion.div>

                {/* 3. 기존 영양제 비교 섹션 */}
                <motion.div variants={itemVariants}>
                    <ComparisonSection comparisonData={comparisonData} />
                </motion.div>

                {/* 4. 섭취 권장사항 섹션 */}
                <motion.div variants={itemVariants}>
                    <RecommendationSection
                        interactions={recommendationData.interactions}
                        dosageInfo={recommendationData.dosageInfo}
                        productNotes={recommendationData.productNotes}
                    />
                </motion.div>

                {/* Bottom Spacer for footer */}
                <div className="report-spacer" />
            </main>

            {/* 고정 푸터 버튼 */}
            <motion.footer
                className="report-footer-modern"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, type: "spring", stiffness: 100 }}
            >
                <motion.button
                    className="footer-btn-modern secondary"
                    onClick={handleBack}
                    whileTap={{ scale: 0.95 }}
                >
                    <RotateCcw size={18} />
                    다시 촬영
                </motion.button>
                <motion.button
                    className="footer-btn-modern primary"
                    onClick={() => setShowRegisterModal(true)}
                    whileTap={{ scale: 0.95 }}
                >
                    내 리스트에 추가
                    <Check size={18} />
                </motion.button>
            </motion.footer>

            {/* 프리미엄 등록 모달 */}
            <RegisterConfirmModal
                isOpen={showRegisterModal}
                products={products}
                onConfirm={handleConfirmRegister}
                onCancel={handleCancelRegister}
                onClose={() => setShowRegisterModal(false)}
            />
        </motion.div>
    );
}
