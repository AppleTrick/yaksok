import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, ShieldCheck, Info, ScanText, SearchX, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles.css';
import CameraHeader from './common/CameraHeader';
import RatioBox from './common/RatioBox';
import { useTheme } from '@/contexts/ThemeContext';
import ActionButton from './common/ActionButton';

interface DetectedObject {
    name: string;
    confidence: number;
    box: number[]; // [x1, y1, x2, y2]
}

interface AnalysisResult {
    displayData: {
        objectCount: number;
        products: DetectedObject[];
    };
    reportData: any;
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
    const products = result.displayData?.products || [];
    const hasResults = products.length > 0;

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
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className={`camera-container ${theme === 'light' ? 'theme-light' : ''}`}>
            <CameraHeader
                title="분석 결과"
                theme={theme}
                onBack={onRetake}
            />

            <div className="result-scroll">
                <div className="camera-content-center" style={{ padding: '0 20px 20px' }}>
                    <RatioBox>
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Analyzed"
                            onLoad={handleImageLoad}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <motion.div
                            className="scan-indicator"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 260,
                                damping: 20
                            }}
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <ScanText size={16} />
                                <span>스캔 완료</span>
                            </motion.div>
                        </motion.div>

                        {imageSize.width > 0 && products.map((obj, idx) => {
                            const img = imageRef.current;
                            if (!img) return null;
                            const scaleX = imageSize.width / img.naturalWidth;
                            const scaleY = imageSize.height / img.naturalHeight;
                            const [x1, y1, x2, y2] = obj.box;
                            const boxWidth = (x2 - x1) * scaleX;
                            const boxHeight = (y2 - y1) * scaleY;
                            const boxLeft = x1 * scaleX;
                            const boxTop = y1 * scaleY;

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
                                            border: `3px solid ${idx === 1 ? '#FFE082' : '#FF5722'}`,
                                            borderRadius: '12px',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '8px',
                                            left: '8px',
                                            background: 'rgba(0,0,0,0.6)',
                                            color: 'white',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            {Math.round(obj.confidence * 100)}%
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 + idx * 0.1 }}
                                        className="obj-tag-v2"
                                        style={{
                                            left: `${boxLeft}px`,
                                            top: `${boxTop}px`,
                                            zIndex: 20
                                        }}
                                    >
                                        {idx + 1}
                                    </motion.div>
                                </React.Fragment>
                            );
                        })}
                    </RatioBox>
                </div>

                <div className="result-list-section">
                    <div className="section-title-row">
                        <h3 className="card-item-title" style={{ fontSize: '1.4rem', color: 'var(--cam-black)' }}>인식된 영양제</h3>
                        <span className="count-badge">{products.length}개 발견</span>
                    </div>

                    <AnimatePresence>
                        {hasResults ? (
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {products.map((obj, idx) => (
                                    <motion.div
                                        key={idx}
                                        variants={itemVariants}
                                        className="report-card"
                                    >
                                        <div className="card-idx-circle" style={{
                                            background: idx === 0 ? 'var(--cam-mint)' : '#FFF9E1',
                                            color: idx === 0 ? 'var(--cam-green)' : '#F59E0B'
                                        }}>
                                            {idx + 1}
                                        </div>
                                        <div className="card-main-info" style={{ flex: 1 }}>
                                            <div className="card-header-line">
                                                <h4 className="card-item-title" style={{ fontSize: '1.1rem', fontWeight: 800 }}>{obj.name}</h4>
                                                <button className="btn-edit-small">수정</button>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${obj.confidence * 100}%` }}
                                                        transition={{ duration: 1, delay: 0.5 }}
                                                        style={{
                                                            height: '100%',
                                                            background: obj.confidence > 0.7 ? 'var(--cam-green)' : 'var(--cam-orange)',
                                                            borderRadius: 10
                                                        }}
                                                    ></motion.div>
                                                </div>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#333' }}>
                                                    {Math.round(obj.confidence * 100)}%
                                                </span>
                                            </div>

                                            <div className={`matching-pill ${obj.confidence <= 0.7 ? 'warning-pill' : ''}`}>
                                                {obj.confidence > 0.7 ? <ShieldCheck size={14} /> : <Info size={14} />}
                                                {obj.confidence > 0.7 ? '정보가 정확합니다' : '확인이 필요해요'}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="empty-result-state"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '40px 0',
                                    textAlign: 'center'
                                }}
                            >
                                <div className="empty-icon-box" style={{
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    background: 'var(--cam-light-gray)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '20px'
                                }}>
                                    <SearchX size={40} color="var(--cam-gray)" />
                                </div>
                                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', color: 'var(--cam-black)' }}>
                                    인식된 영양제가 없습니다
                                </h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--cam-gray)', lineHeight: 1.5 }}>
                                    촬영 각도를 조절하거나<br />
                                    밝은 곳에서 다시 촬영해 보세요.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <footer className="sticky-footer" style={{ borderTop: '1px solid var(--cam-border)' }}>
                <div className="cam-btn-row" style={{ padding: '16px 20px', width: '100%' }}>
                    <ActionButton onClick={onRetake} variant="outline">
                        <RotateCcw size={20} />
                        <span>다시 촬영</span>
                    </ActionButton>
                    <ActionButton
                        onClick={onRegister}
                        variant="primary"
                        disabled={!hasResults}
                        className={!hasResults ? 'btn-disabled' : ''}
                    >
                        <span>리포트 보기</span>
                        <ArrowRight size={20} strokeWidth={3} />
                    </ActionButton>
                </div>
            </footer>

            <style jsx>{`
                .sticky-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: var(--cam-glass);
                    backdrop-filter: blur(20px);
                    z-index: 1000;
                    padding-bottom: env(safe-area-inset-bottom);
                }
                .btn-disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    filter: grayscale(1);
                }
            `}</style>
        </div>
    );
}
