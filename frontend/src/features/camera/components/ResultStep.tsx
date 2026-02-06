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
    const isDark = theme === 'dark';
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
        <div className={`camera-container theme-${theme}`}>
            <CameraHeader
                title="분석 결과"
                theme={isDark ? "dark" : "light"}
                stepInfo="Step 3/3"
                onBack={onRetake}
            />

            <div className="result-scroll" style={{ overflow: 'hidden', position: 'relative', background: 'var(--cam-bg-soft)' }}>
                <div className="camera-content-center" style={{ padding: '0 20px', height: '52dvh' }}>
                    <RatioBox>
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Analyzed"
                            onLoad={handleImageLoad}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                backgroundColor: isDark ? '#0a0a0a' : '#f0f0f0',
                                borderRadius: '16px'
                            }}
                        />
                        {/* 스캔 완료 인디케이터 */}
                        <motion.div
                            className="scan-indicator"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            style={{
                                background: 'var(--cam-glass)',
                                color: 'var(--cam-black)',
                                border: '1px solid var(--cam-border)'
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 2.5 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <Sparkles size={14} color="var(--cam-orange)" />
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
                            const borderColor = hasIngredients ? 'var(--cam-green)' : 'var(--cam-orange)';

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
                                            boxShadow: isDark ? `0 0 20px ${borderColor}40` : 'none'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '-28px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            background: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.9)',
                                            color: 'var(--cam-black)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            whiteSpace: 'nowrap',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid var(--cam-border)',
                                            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                                        }}>
                                            {obj.name}
                                        </div>
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
                        background: 'var(--cam-surface)',
                        borderRadius: '24px 24px 0 0',
                        boxShadow: isDark ? '0 -10px 40px rgba(0,0,0,0.5)' : '0 -10px 40px rgba(0,0,0,0.05)',
                        borderTop: '1px solid var(--cam-border)'
                    }}
                >
                    {/* Drag Handle */}
                    <div style={{ width: '100%', height: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'grab' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--cam-gray)', opacity: 0.3 }} />
                    </div>

                    {/* 헤더 섹션 */}
                    <div style={{ padding: '0 20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cam-black)', margin: 0 }}>
                                인식된 영양제
                            </h3>
                            <span style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                background: 'var(--cam-mint)',
                                color: 'var(--cam-green)'
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
                                    borderRadius: '16px',
                                    background: 'var(--cam-bg-soft)',
                                    border: '1px solid var(--cam-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--cam-green)' }}>{totalIngredients}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--cam-gray)', fontWeight: 600 }}>총 성분</div>
                                </div>
                                <div style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '16px',
                                    background: 'var(--cam-bg-soft)',
                                    border: '1px solid var(--cam-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: warningCount > 0 ? 'var(--cam-orange)' : 'var(--cam-green)' }}>
                                        {warningCount > 0 ? warningCount : '✓'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--cam-gray)', fontWeight: 600 }}>
                                        {warningCount > 0 ? '주의 성분' : '안전 확인'}
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
                                                background: 'var(--cam-bg-soft)',
                                                borderRadius: '20px',
                                                padding: '18px',
                                                marginBottom: '12px',
                                                border: '1px solid var(--cam-border)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                                {/* 아이콘 */}
                                                <div style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '14px',
                                                    background: hasIngredients ? 'var(--cam-mint)' : 'rgba(255, 107, 61, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <Pill size={20} color={hasIngredients ? 'var(--cam-green)' : 'var(--cam-orange)'} />
                                                </div>

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    {/* 제품명 */}
                                                    <h4 style={{
                                                        fontSize: '1rem',
                                                        fontWeight: 700,
                                                        color: 'var(--cam-black)',
                                                        margin: '0 0 4px 0',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}>
                                                        {obj.name}
                                                    </h4>

                                                    {/* 성분 표시 (한 줄로 간소화) */}
                                                    {hasIngredients ? (
                                                        <div style={{
                                                            fontSize: '0.8rem',
                                                            color: 'var(--cam-gray)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            fontWeight: 500
                                                        }}>
                                                            {obj.ingredients.map(ing => ing.name).join(', ')}
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--cam-orange)', fontWeight: 600 }}>
                                                            성분 분석 중...
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 상태 아이콘 배지 */}
                                                <div style={{ flexShrink: 0 }}>
                                                    {productWarnings > 0 ? (
                                                        <AlertTriangle size={18} color="var(--cam-orange)" />
                                                    ) : (
                                                        <ShieldCheck size={18} color="var(--cam-green)" />
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
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    background: 'var(--cam-bg-soft)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px',
                                    border: '1px solid var(--cam-border)'
                                }}>
                                    <SearchX size={32} color="var(--cam-gray)" />
                                </div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: 'var(--cam-black)' }}>
                                    인식된 영양제가 없습니다
                                </h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--cam-gray)', lineHeight: 1.6 }}>
                                    영양제가 잘 보이도록 촬영해주세요.<br />
                                    밝은 곳에서 촬영하면 인식률이 높아져요.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <footer className="sticky-footer" style={{ borderTop: '1px solid var(--cam-border)' }}>
                <div className="cam-btn-row" style={{ padding: '16px 20px', width: '100%', background: 'none' }}>
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
                    background: var(--cam-surface);
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
