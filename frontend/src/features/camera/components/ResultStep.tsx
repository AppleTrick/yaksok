import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, ShieldCheck, AlertTriangle, ScanText, SearchX, ArrowRight, Pill, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion';
import '../styles.css';
import CameraHeader from './common/CameraHeader';
import RatioBox from './common/RatioBox';
import { useTheme } from '@/contexts/ThemeContext';
import ActionButton from './common/ActionButton';

interface ProductIngredient {
    name: string;
    amount: string;
    unit: string;
    myAmount: string;
    totalAmount: string;
    status: 'safe' | 'warning';
}

interface DetectedProduct {
    productId: number | null;
    name: string;
    box: number[]; // [x1, y1, x2, y2]
    ingredients: ProductIngredient[];
}

interface AnalysisResult {
    reportData: {
        products: DetectedProduct[];
    };
}

interface ResultStepProps {
    imageSrc: string;
    result: AnalysisResult;
    onRetake: () => void;
    onRegister: () => void;
}

export default function ResultStep({ imageSrc, result, onRetake, onRegister }: ResultStepProps) {
    const { theme } = useTheme();
    const imageRef = useRef<HTMLImageElement>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const products = result?.reportData?.products || [];
    const hasResults = products.length > 0;
    const controls = useAnimation();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget.getBoundingClientRect();
        setImageSize({ width, height });
    };

    useEffect(() => {
        const updateSize = () => {
            if (imageRef.current) {
                const { width, height } = imageRef.current.getBoundingClientRect();
                setImageSize({ width, height });
            }
        };
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (info.offset.y < -threshold) {
            setIsExpanded(true);
            controls.start({ y: -300 });
        } else if (info.offset.y > threshold) {
            setIsExpanded(false);
            controls.start({ y: 0 });
        } else {
            controls.start({ y: isExpanded ? -300 : 0 });
        }
    };

    // 통계 계산
    const totalIngredients = products.reduce((acc, p) => acc + (p.ingredients?.length || 0), 0);
    const warningCount = products.reduce((acc, p) =>
        acc + (p.ingredients?.filter(i => i.status === 'warning').length || 0), 0);

    return (
        <div className="camera-container theme-dark">
            <CameraHeader
                title="분석 결과"
                theme="dark"
                stepInfo="Step 3/3"
                onBack={onRetake}
            />

            <div className="result-scroll" style={{ overflow: 'hidden', position: 'relative' }}>
                <div className="camera-content-center" style={{ padding: '0 20px', height: '55dvh' }}>
                    <RatioBox>
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Analyzed"
                            onLoad={handleImageLoad}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#0a0a0a', borderRadius: '16px' }}
                        />
                        {/* 스캔 완료 인디케이터 */}
                        <motion.div
                            className="scan-indicator"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2.5 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Sparkles size={14} />
                                <span>AI 분석 완료</span>
                            </motion.div>
                        </motion.div>

                        {/* Bounding Boxes */}
                        {imageSize.width > 0 && products.map((obj, idx) => {
                            const img = imageRef.current;
                            if (!img || !obj.box || obj.box.length < 4) return null;

                            const scaleX = imageSize.width / img.naturalWidth;
                            const scaleY = imageSize.height / img.naturalHeight;
                            const [x1, y1, x2, y2] = obj.box;
                            const boxWidth = (x2 - x1) * scaleX;
                            const boxHeight = (y2 - y1) * scaleY;
                            const boxLeft = x1 * scaleX;
                            const boxTop = y1 * scaleY;

                            const hasIngredients = obj.ingredients && obj.ingredients.length > 0;
                            const borderColor = hasIngredients ? '#10B981' : '#F59E0B';

                            return (
                                <React.Fragment key={idx}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                        style={{
                                            position: 'absolute',
                                            left: `${boxLeft}px`,
                                            top: `${boxTop}px`,
                                            width: `${boxWidth}px`,
                                            height: `${boxHeight}px`,
                                            border: `2px solid ${borderColor}`,
                                            borderRadius: '12px',
                                            pointerEvents: 'none',
                                            zIndex: 10,
                                            boxShadow: `0 0 20px ${borderColor}40`
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-28px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: 'linear-gradient(135deg, rgba(0,0,0,0.85), rgba(20,20,20,0.95))',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            whiteSpace: 'nowrap',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            {obj.name}
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 + idx * 0.1, type: "spring" }}
                                        style={{
                                            position: 'absolute',
                                            left: `${boxLeft - 10}px`,
                                            top: `${boxTop - 10}px`,
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${borderColor}, ${borderColor}dd)`,
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            zIndex: 20,
                                            boxShadow: `0 2px 8px ${borderColor}60`
                                        }}
                                    >
                                        {idx + 1}
                                    </motion.div>
                                </React.Fragment>
                            );
                        })}
                    </RatioBox>
                </div>

                {/* Bottom Sheet */}
                <motion.div
                    className="result-list-section bottom-sheet"
                    drag="y"
                    dragConstraints={{ top: -400, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={onDragEnd}
                    animate={controls}
                    initial={{ y: 0 }}
                    style={{
                        touchAction: 'none',
                        marginTop: '-10px',
                        minHeight: '80vh',
                        background: 'linear-gradient(180deg, rgba(15,15,20,0.98) 0%, rgba(10,10,15,1) 100%)',
                        borderRadius: '24px 24px 0 0',
                        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Drag Handle */}
                    <div style={{ width: '100%', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'grab' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)' }} />
                    </div>

                    {/* 헤더 섹션 */}
                    <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                                인식된 영양제
                            </h3>
                            <span style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                color: 'white'
                            }}>
                                {products.length}개 발견
                            </span>
                        </div>

                        {/* 요약 통계 */}
                        {hasResults && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: 'rgba(16,185,129,0.1)',
                                    border: '1px solid rgba(16,185,129,0.2)'
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10B981' }}>{totalIngredients}</div>
                                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>총 성분</div>
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: warningCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                                    border: `1px solid ${warningCount > 0 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)'}`
                                }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: warningCount > 0 ? '#F59E0B' : '#10B981' }}>
                                        {warningCount > 0 ? warningCount : '✓'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#9CA3AF' }}>
                                        {warningCount > 0 ? '주의 성분' : '안전'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {hasResults ? (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                style={{ padding: '0 20px', paddingBottom: '140px' }}
                            >
                                {products.map((obj, idx) => {
                                    const hasIngredients = obj.ingredients && obj.ingredients.length > 0;
                                    const productWarnings = obj.ingredients?.filter(i => i.status === 'warning').length || 0;

                                    return (
                                        <motion.div
                                            key={idx}
                                            variants={itemVariants}
                                            style={{
                                                background: 'linear-gradient(145deg, rgba(30,30,40,0.8), rgba(20,20,30,0.9))',
                                                borderRadius: '16px',
                                                padding: '16px',
                                                marginBottom: '12px',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                backdropFilter: 'blur(10px)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                                {/* 인덱스 서클 */}
                                                <div style={{
                                                    width: '36px',
                                                    height: '36px',
                                                    borderRadius: '12px',
                                                    background: hasIngredients
                                                        ? 'linear-gradient(135deg, #10B981, #059669)'
                                                        : 'linear-gradient(135deg, #F59E0B, #D97706)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <Pill size={18} color="white" />
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* 제품명 */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                        <h4 style={{
                                                            fontSize: '1rem',
                                                            fontWeight: 700,
                                                            color: '#fff',
                                                            margin: 0,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {obj.name}
                                                        </h4>
                                                    </div>

                                                    {/* 성분 표시 */}
                                                    {hasIngredients ? (
                                                        <>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                                                {obj.ingredients.slice(0, 4).map((ing, ingIdx) => (
                                                                    <span
                                                                        key={ingIdx}
                                                                        style={{
                                                                            padding: '5px 10px',
                                                                            borderRadius: '8px',
                                                                            fontSize: '0.7rem',
                                                                            fontWeight: 600,
                                                                            background: ing.status === 'warning'
                                                                                ? 'rgba(245,158,11,0.15)'
                                                                                : 'rgba(16,185,129,0.15)',
                                                                            color: ing.status === 'warning' ? '#FBBF24' : '#34D399',
                                                                            border: `1px solid ${ing.status === 'warning' ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`
                                                                        }}
                                                                    >
                                                                        {ing.name} {ing.amount}{ing.unit}
                                                                    </span>
                                                                ))}
                                                                {obj.ingredients.length > 4 && (
                                                                    <span style={{
                                                                        padding: '5px 10px',
                                                                        fontSize: '0.7rem',
                                                                        color: '#6B7280',
                                                                        background: 'rgba(107,114,128,0.1)',
                                                                        borderRadius: '8px'
                                                                    }}>
                                                                        +{obj.ingredients.length - 4}개
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* 상태 배지 */}
                                                            <div style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 12px',
                                                                borderRadius: '20px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                background: productWarnings > 0
                                                                    ? 'rgba(245,158,11,0.15)'
                                                                    : 'rgba(16,185,129,0.15)',
                                                                color: productWarnings > 0 ? '#FBBF24' : '#34D399'
                                                            }}>
                                                                {productWarnings > 0
                                                                    ? <><AlertTriangle size={14} /> {productWarnings}개 성분 주의</>
                                                                    : <><ShieldCheck size={14} /> 안전한 섭취량</>
                                                                }
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{
                                                            padding: '12px 16px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(245,158,11,0.1)',
                                                            border: '1px solid rgba(245,158,11,0.2)'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FBBF24', fontSize: '0.8rem', fontWeight: 600 }}>
                                                                <AlertTriangle size={16} />
                                                                성분 정보 로딩 중...
                                                            </div>
                                                            <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: '6px 0 0 0' }}>
                                                                AI가 성분 정보를 분석하고 있습니다. 잠시 후 다시 확인해주세요.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '60px 20px',
                                    textAlign: 'center'
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'rgba(107,114,128,0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <SearchX size={36} color="#6B7280" />
                                </div>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
                                    인식된 영양제가 없습니다
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: '#9CA3AF', lineHeight: 1.6 }}>
                                    영양제가 잘 보이도록 촬영해주세요.<br />
                                    밝은 곳에서 촬영하면 인식률이 높아져요.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <footer className="sticky-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="cam-btn-row" style={{ padding: '16px 20px', width: '100%' }}>
                    <ActionButton onClick={onRetake} variant="secondary">
                        <RotateCcw size={18} />
                        <span>다시 촬영</span>
                    </ActionButton>
                    <ActionButton
                        onClick={onRegister}
                        variant={hasResults ? "primary" : "secondary"}
                        disabled={!hasResults}
                        className={!hasResults ? 'btn-disabled' : ''}
                    >
                        {hasResults ? (
                            <>
                                <span>리포트 보기</span>
                                <ArrowRight size={18} strokeWidth={2.5} />
                            </>
                        ) : (
                            <>
                                <SearchX size={18} />
                                <span>인식 정보 없음</span>
                            </>
                        )}
                    </ActionButton>
                </div>
            </footer>

            <style jsx>{`
                .sticky-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(180deg, rgba(15,15,20,0.95), rgba(10,10,15,1));
                    backdrop-filter: blur(20px);
                    z-index: 1000;
                    padding-bottom: env(safe-area-inset-bottom);
                }
                .btn-disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                    filter: grayscale(1);
                }
            `}</style>
        </div>
    );
}
