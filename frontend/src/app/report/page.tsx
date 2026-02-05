"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Check, ShieldCheck, AlertTriangle, Pill, TrendingUp, Info } from 'lucide-react';
import { useReportContext } from '@/features/report/contexts/ReportContext';
import '@/features/report/styles.css';
import { motion, Variants } from 'framer-motion';

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
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [selectedProductIdx, setSelectedProductIdx] = useState<number>(0);

    useEffect(() => {
        if (!reportData.analysisResult) {
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

    const handleConfirmRegister = () => {
        setShowRegisterModal(false);
        clearReportData();
        router.push('/my-supplements');
    };

    const realReportData = reportData.analysisResult?.reportData;
    const products: Product[] = realReportData?.products || [];

    // 통계 계산
    const totalIngredients = products.reduce((acc, p) => acc + (p.ingredients?.length || 0), 0);
    const warningIngredients = products.reduce((acc, p) =>
        acc + (p.ingredients?.filter(i => i.status === 'warning').length || 0), 0);
    const safeIngredients = totalIngredients - warningIngredients;

    return (
        <motion.div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(180deg, #0f0f14 0%, #1a1a24 50%, #0f0f14 100%)',
                color: '#fff'
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
                    background: 'linear-gradient(180deg, rgba(15,15,20,1) 0%, rgba(15,15,20,0) 100%)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 50
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={handleBack}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 16px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RotateCcw size={16} />
                        다시 촬영
                    </button>
                    <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>영양제 리포트</h1>
                    <div style={{ width: '80px' }} />
                </div>
            </motion.header>

            <main style={{ padding: '0 20px', paddingBottom: '120px' }}>
                {/* 요약 카드 */}
                <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(59,130,246,0.1) 100%)',
                        borderRadius: '20px',
                        padding: '20px',
                        border: '1px solid rgba(16,185,129,0.2)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <TrendingUp size={20} color="#10B981" />
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>분석 요약</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>{products.length}</div>
                                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>인식된 제품</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3B82F6' }}>{totalIngredients}</div>
                                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>총 성분</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: warningIngredients > 0 ? '#F59E0B' : '#10B981' }}>
                                    {warningIngredients > 0 ? warningIngredients : '✓'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                    {warningIngredients > 0 ? '주의 성분' : '모두 안전'}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 제품 탭 */}
                <motion.div variants={itemVariants} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {products.map((product, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedProductIdx(idx)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: selectedProductIdx === idx
                                        ? 'linear-gradient(135deg, #10B981, #059669)'
                                        : 'rgba(255,255,255,0.05)',
                                    color: selectedProductIdx === idx ? '#fff' : '#9CA3AF',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* 제품 헤더 */}
                        <div style={{
                            background: 'rgba(30,30,40,0.6)',
                            borderRadius: '16px',
                            padding: '20px',
                            marginBottom: '16px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '14px',
                                    background: 'linear-gradient(135deg, #10B981, #059669)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Pill size={22} color="#fff" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                                        {products[selectedProductIdx].name}
                                    </h2>
                                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: 0 }}>
                                        {products[selectedProductIdx].ingredients?.length || 0}개 성분 포함
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 성분 리스트 */}
                        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
                            📊 성분별 섭취량 분석
                        </h3>

                        {products[selectedProductIdx].ingredients?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {products[selectedProductIdx].ingredients.map((ing, idx) => {
                                    const myAmountNum = parseFloat(ing.myAmount) || 0;
                                    const totalAmountNum = parseFloat(ing.totalAmount) || 0;
                                    const amountNum = parseFloat(ing.amount) || 0;

                                    return (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            style={{
                                                background: 'rgba(30,30,40,0.6)',
                                                borderRadius: '14px',
                                                padding: '16px',
                                                border: `1px solid ${ing.status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.05)'}`
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{ing.name}</span>
                                                    {ing.status === 'warning' ? (
                                                        <AlertTriangle size={14} color="#F59E0B" />
                                                    ) : (
                                                        <ShieldCheck size={14} color="#10B981" />
                                                    )}
                                                </div>
                                                <span style={{
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600,
                                                    background: ing.status === 'warning' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                                                    color: ing.status === 'warning' ? '#FBBF24' : '#34D399'
                                                }}>
                                                    {ing.status === 'warning' ? '과다섭취 주의' : '안전'}
                                                </span>
                                            </div>

                                            {/* 섭취량 비교 바 */}
                                            <div style={{ marginBottom: '8px' }}>
                                                <div style={{
                                                    height: '8px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    overflow: 'hidden',
                                                    display: 'flex'
                                                }}>
                                                    {/* 기존 섭취량 */}
                                                    {myAmountNum > 0 && (
                                                        <div style={{
                                                            width: `${Math.min((myAmountNum / (totalAmountNum || 1)) * 100, 100)}%`,
                                                            height: '100%',
                                                            background: '#3B82F6'
                                                        }} />
                                                    )}
                                                    {/* 추가 섭취량 */}
                                                    <div style={{
                                                        width: `${Math.min((amountNum / (totalAmountNum || 1)) * 100, 100)}%`,
                                                        height: '100%',
                                                        background: ing.status === 'warning' ? '#F59E0B' : '#10B981'
                                                    }} />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#9CA3AF' }}>
                                                <span>기존: {ing.myAmount}{ing.unit}</span>
                                                <span>추가: +{ing.amount}{ing.unit}</span>
                                                <span style={{ fontWeight: 700, color: ing.status === 'warning' ? '#FBBF24' : '#34D399' }}>
                                                    합계: {ing.totalAmount}{ing.unit}
                                                </span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{
                                background: 'rgba(245,158,11,0.1)',
                                borderRadius: '14px',
                                padding: '24px',
                                textAlign: 'center',
                                border: '1px solid rgba(245,158,11,0.2)'
                            }}>
                                <Info size={32} color="#F59E0B" style={{ marginBottom: '12px' }} />
                                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: '#FBBF24' }}>
                                    성분 정보를 불러오는 중입니다
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', margin: 0 }}>
                                    AI가 이 제품의 성분 정보를 분석하고 있습니다.<br />
                                    잠시 후 다시 확인해 주세요.
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </main>

            {/* 고정 푸터 */}
            <motion.footer
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '16px 20px',
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
                    background: 'linear-gradient(180deg, rgba(15,15,20,0.9), rgba(10,10,15,1))',
                    backdropFilter: 'blur(20px)',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    zIndex: 100
                }}
            >
                <button
                    onClick={handleConfirmRegister}
                    style={{
                        width: '100%',
                        padding: '16px',
                        borderRadius: '14px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 20px rgba(16,185,129,0.3)'
                    }}
                >
                    <Check size={20} />
                    내 리스트에 추가하기
                </button>
            </motion.footer>
        </motion.div>
    );
}
