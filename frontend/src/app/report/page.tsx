"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, ShieldCheck, AlertTriangle, Pill, TrendingUp, Info, ArrowRight, CheckCircle } from 'lucide-react';
import { useReportContext } from '@/features/report/contexts/ReportContext';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { useTheme } from '@/contexts/ThemeContext';
import '@/features/report/styles.css';
import { motion, Variants } from 'framer-motion';
import Modal from '@/components/Modal';
import Button from '@/components/Button';

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
};

interface ProductIngredient {
    name: string;
    amount: string;
    unit: string;
    myAmount: string;
    totalAmount: string;
    status: 'safe' | 'warning';
}

interface Product {
    productId: number | null;
    name: string;
    box: number[];
    ingredients: ProductIngredient[];
}

export default function ReportPage() {
    const router = useRouter();
    const { reportData, clearReportData } = useReportContext();
    const { refreshSchedules } = useScheduleContext();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [selectedProductIdx, setSelectedProductIdx] = useState<number>(0);
    const [successModal, setSuccessModal] = useState<{ open: boolean; count: number }>({ open: false, count: 0 });
    const [isRegistering, setIsRegistering] = useState(false);
    const isNavigatingRef = useRef(false);

    // 상한 초과 경고 모달 상태
    const [warningModal, setWarningModal] = useState<{ open: boolean; ingredients: string[] }>({ open: false, ingredients: [] });

    useEffect(() => {
        // 등록 완료 후 네비게이션 중에는 리다이렉트 하지 않음
        if (!reportData.analysisResult && !isNavigatingRef.current) {
            router.replace('/camera');
        }
    }, [reportData.analysisResult, router]);

    if (!reportData.analysisResult) {
        return null;
    }

    const handleBack = () => {
        clearReportData();
        router.push('/camera');
    };

    const handleConfirmRegister = async () => {
        const realReportData = reportData.analysisResult?.reportData;
        const products: Product[] = realReportData?.products || [];

        if (products.length === 0) {
            alert('등록할 영양제가 없습니다.');
            return;
        }

        // 상한 초과 성분 체크
        const warningIngredients: string[] = [];
        products.forEach(product => {
            product.ingredients?.forEach(ing => {
                if (ing.status === 'warning' && !warningIngredients.includes(ing.name)) {
                    warningIngredients.push(ing.name);
                }
            });
        });

        // 상한 초과 성분이 있으면 경고 모달 표시
        if (warningIngredients.length > 0) {
            setWarningModal({ open: true, ingredients: warningIngredients });
            return;
        }

        setIsRegistering(true);

        try {
            // 유효한 productId가 있는 제품만 등록
            const validProducts = products.filter(p => p.productId !== null);

            if (validProducts.length === 0) {
                alert('등록 가능한 영양제가 없습니다. (제품 정보가 DB에 없음)');
                isNavigatingRef.current = true;
                clearReportData();
                router.push('/my-supplements');
                return;
            }

            // 각 제품 등록 API 호출
            for (const product of validProducts) {
                const response = await fetch('/api/v1/products/user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        productId: product.productId,
                        nickname: product.name,
                        dailyDose: 1,
                        doseAmount: 1,
                        doseUnit: '정'
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`영양제 등록 실패: ${product.name}`, errorText);
                }
            }

            // 데이터 새로고침
            await refreshSchedules();

            // 성공 Modal 표시
            setSuccessModal({ open: true, count: validProducts.length });
        } catch (error) {
            console.error('영양제 등록 중 오류:', error);
            alert('영양제 등록 중 오류가 발생했습니다.');
        } finally {
            setIsRegistering(false);
        }
    };

    const handleSuccessModalClose = () => {
        setSuccessModal({ open: false, count: 0 });
        isNavigatingRef.current = true;
        clearReportData();
        router.push('/my-supplements');
    };

    const handleWarningModalClose = () => {
        setWarningModal({ open: false, ingredients: [] });
        isNavigatingRef.current = true;
        clearReportData();
        router.push('/camera');
    };

    const realReportData = reportData.analysisResult?.reportData;
    const products: Product[] = realReportData?.products || [];

    // 통계 계산
    const totalIngredients = products.reduce((acc, p) => acc + (p.ingredients?.length || 0), 0);
    const warningIngredients = products.reduce((acc, p) =>
        acc + (p.ingredients?.filter(i => i.status === 'warning').length || 0), 0);

    return (
        <motion.div
            style={{
                minHeight: '100vh',
                background: isDark ? 'var(--cam-bg-soft)' : '#F8F9FA',
                color: 'var(--cam-black)'
            }}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* 헤더 */}
            <motion.header
                variants={itemVariants}
                style={{
                    padding: '20px',
                    paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
                    background: 'transparent',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <button
                    onClick={handleBack}
                    style={{
                        position: 'absolute',
                        left: '20px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--cam-black)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.9rem',
                        fontWeight: 600
                    }}
                >
                    <RotateCcw size={18} />
                    <span>다시 찍기</span>
                </button>
                <h1 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--cam-black)' }}>영양제 리포트</h1>
            </motion.header>

            <main style={{ padding: '0 20px', paddingBottom: '140px' }}>
                {/* 요약 카드 */}
                <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
                    <div style={{
                        background: isDark ? '#2B2C37' : '#FFFFFF',
                        borderRadius: '24px',
                        padding: '24px',
                        border: '1px solid var(--cam-border)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', position: 'relative', zIndex: 2 }}>
                            <TrendingUp size={20} color="var(--cam-orange)" />
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--cam-black)' }}>분석 요약</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', position: 'relative', zIndex: 2 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--cam-black)' }}>{products.length}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cam-gray)', fontWeight: 600 }}>인식된 제품</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 850, color: 'var(--cam-black)' }}>{totalIngredients}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cam-gray)', fontWeight: 600 }}>총 성분</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 850, color: warningIngredients > 0 ? 'var(--cam-orange)' : 'var(--cam-green)' }}>
                                    {warningIngredients > 0 ? warningIngredients : '✓'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--cam-gray)', fontWeight: 600 }}>
                                    {warningIngredients > 0 ? '주의 성분' : '모두 안전'}
                                </div>
                            </div>
                        </div>

                        {/* 배경 데코레이션 아이콘 */}
                        <Pill size={80} style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.03, color: 'var(--cam-black)', transform: 'rotate(-15deg)' }} />
                    </div>
                </motion.div>

                {/* 제품 탭 */}
                <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                        {products.map((product, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedProductIdx(idx)}
                                style={{
                                    padding: '10px 18px',
                                    borderRadius: '14px',
                                    border: '1px solid var(--cam-border)',
                                    background: selectedProductIdx === idx
                                        ? 'var(--cam-orange)'
                                        : 'var(--cam-surface)',
                                    color: selectedProductIdx === idx ? '#fff' : 'var(--cam-gray)',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: selectedProductIdx === idx ? '0 4px 12px rgba(255, 107, 61, 0.2)' : 'none'
                                }}
                            >
                                {product.name}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* 선택된 제품 상세 */}
                {products[selectedProductIdx] && (
                    <motion.div
                        key={selectedProductIdx}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                        {/* 제품 헤더 */}
                        <div style={{
                            background: 'var(--cam-surface)',
                            borderRadius: '20px',
                            padding: '20px',
                            marginBottom: '20px',
                            border: '1px solid var(--cam-border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '16px',
                                background: 'var(--cam-mint)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Pill size={24} color="var(--cam-green)" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--cam-black)' }}>
                                    {products[selectedProductIdx].name}
                                </h2>
                                <p style={{ fontSize: '0.8rem', color: 'var(--cam-gray)', fontWeight: 600, margin: 0 }}>
                                    총 {products[selectedProductIdx].ingredients?.length || 0}개 성분 분석 완료
                                </p>
                            </div>
                        </div>

                        {/* 성분 리스트 */}
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '14px', color: 'var(--cam-black)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📊 성분별 섭취량 분석
                        </h3>

                        {products[selectedProductIdx].ingredients?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {products[selectedProductIdx].ingredients.map((ing, idx) => {
                                    const myAmountNum = Math.round(parseFloat(ing.myAmount) || 0);
                                    const amountNum = Math.round(parseFloat(ing.amount) || 0);
                                    const totalAmountNum = Math.round(parseFloat(ing.totalAmount) || 0);

                                    // 권장량 대비 퍼센트 (임의 계산 logic - totalAmountNum이 1일 권장량 기준이라고 가정할 때)
                                    // 실제 로직에 맞게 조정 가능. 여기서는 100% 임의 시뮬레이션
                                    const percent = Math.min(Math.round((totalAmountNum / 400) * 100), 100);

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.06 }}
                                            style={{
                                                background: isDark ? '#23242B' : '#FFFFFF',
                                                borderRadius: '18px',
                                                padding: '20px',
                                                border: '1px solid var(--cam-border)',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--cam-black)' }}>{ing.name}</span>
                                                        {ing.status === 'warning' && <AlertTriangle size={15} color="var(--cam-orange)" />}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--cam-gray)', fontWeight: 600 }}>
                                                        총 {totalAmountNum}{ing.unit} <span style={{ color: 'var(--cam-orange)', marginLeft: '4px' }}>({percent}%)</span>
                                                    </div>
                                                </div>

                                                <div style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    background: ing.status === 'warning' ? 'rgba(255,107,61,0.1)' : 'var(--cam-mint)',
                                                    color: ing.status === 'warning' ? 'var(--cam-orange)' : 'var(--cam-green)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    {ing.status === 'warning' ? '과다주의' : '안전'}
                                                </div>
                                            </div>

                                            {/* 섭취량 비교 바 */}
                                            <div style={{
                                                height: '10px',
                                                borderRadius: '5px',
                                                background: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6',
                                                overflow: 'hidden',
                                                display: 'flex',
                                                marginBottom: '6px'
                                            }}>
                                                {/* 기존 섭취량 */}
                                                {myAmountNum > 0 && (
                                                    <div style={{
                                                        width: `${Math.min((myAmountNum / (totalAmountNum || 1)) * 100, 100)}%`,
                                                        height: '100%',
                                                        background: 'var(--cam-gray)',
                                                        opacity: 0.5
                                                    }} />
                                                )}
                                                {/* 추가 섭취량 */}
                                                <div style={{
                                                    width: `${Math.min((amountNum / (totalAmountNum || 1)) * 100, 100)}%`,
                                                    height: '100%',
                                                    background: ing.status === 'warning' ? 'var(--cam-orange)' : 'var(--cam-green)'
                                                }} />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                background: 'var(--cam-surface)',
                                borderRadius: '20px',
                                padding: '32px 24px',
                                textAlign: 'center',
                                border: '1px dashed var(--cam-gray)',
                                opacity: 0.6
                            }}>
                                <Info size={32} color="var(--cam-gray)" style={{ marginBottom: '12px' }} />
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '6px', color: 'var(--cam-black)' }}>
                                    성분 정보 분석 중
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--cam-gray)', margin: 0, lineHeight: 1.5 }}>
                                    AI가 제품의 상세 정보를 확인하고 있습니다.<br />
                                    잠시만 기다려주세요.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            {/* 고정 푸터 (Floating CTA) */}
            <motion.footer
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6, type: "spring", damping: 20 }}
                style={{
                    position: 'fixed',
                    bottom: '34px',
                    left: 0,
                    right: 0,
                    padding: '0 20px',
                    zIndex: 100
                }}
            >
                <button
                    onClick={handleConfirmRegister}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '20px',
                        border: 'none',
                        background: isRegistering ? '#ccc' : 'linear-gradient(to right, #FF6B3D, #FF8E5E)',
                        color: '#fff',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        cursor: isRegistering ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: isRegistering ? 'none' : '0 12px 24px rgba(255, 107, 61, 0.3)',
                        transition: 'transform 0.2s active'
                    }}
                    disabled={isRegistering}
                >
                    <span>{isRegistering ? '등록 중...' : `${products.length}개 영양제 등록하기`}</span>
                    {!isRegistering && <ArrowRight size={22} />}
                </button>
            </motion.footer>

            {/* 등록 성공 Modal */}
            <Modal
                isOpen={successModal.open}
                onClose={handleSuccessModalClose}
                title="등록 완료"
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <CheckCircle size={64} color="#4CAF50" style={{ marginBottom: '16px' }} />
                    <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>
                        <strong>{successModal.count}개</strong> 영양제가 등록되었습니다!
                    </p>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                        내 영양제 목록에서 확인하세요.
                    </p>
                </div>
                <Button
                    onClick={handleSuccessModalClose}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: 'linear-gradient(to right, #FF6B3D, #FF8E5E)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    내 영양제 보기
                </Button>
            </Modal>

            {/* 상한 초과 경고 Modal */}
            <Modal
                isOpen={warningModal.open}
                onClose={handleWarningModalClose}
                title="⚠️ 섭취량 주의"
                type="alert"
                onConfirm={handleWarningModalClose}
                confirmText="확인"
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <AlertTriangle size={64} color="var(--cam-orange)" style={{ marginBottom: '16px' }} />
                    <p style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--cam-black)' }}>
                        영양제 섭취 시 다음 성분이<br />
                        <strong style={{ color: 'var(--cam-orange)' }}>상한 섭취량을 초과</strong>했습니다.
                    </p>
                    <div style={{
                        background: isDark ? '#2B2C37' : '#F8F9FA',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        marginBottom: '12px'
                    }}>
                        {warningModal.ingredients.map((name, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 0',
                                borderBottom: idx < warningModal.ingredients.length - 1 ? '1px solid var(--cam-border)' : 'none'
                            }}>
                                <span style={{ color: 'var(--cam-orange)', fontWeight: 700 }}>•</span>
                                <span style={{ fontWeight: 600, color: 'var(--cam-black)' }}>{name}</span>
                            </div>
                        ))}
                    </div>
                    <p style={{ color: 'var(--cam-gray)', fontSize: '0.85rem', margin: 0 }}>
                        과다 섭취 시 부작용이 발생할 수 있습니다.<br />
                        섭취량을 조절해주세요.
                    </p>
                </div>
            </Modal>

            <style jsx>{`
                main::-webkit-scrollbar {
                    display: none;
                }
                button:active {
                    transform: scale(0.97);
                }
            `}</style>
        </motion.div>
    );
}
