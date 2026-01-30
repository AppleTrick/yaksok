"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Check, RotateCcw, ShieldCheck, Info, ScanText } from 'lucide-react';
import '../styles.css';
import CameraHeader from './common/CameraHeader';
import RatioBox from './common/RatioBox';

import ActionButton from './common/ActionButton';

interface DetectedObject {
    name: string;
    barcode: string | null;
    confidence: number;
    box: number[]; // [x1, y1, x2, y2]
}

interface AnalysisResult {
    displayData: {
        objectCount: number;
        products: DetectedObject[];
    };
    reportData: any; // Used in other pages
}

interface ResultStepProps {
    imageSrc: string;
    result: AnalysisResult;
    onRetake: () => void;
    onRegister: () => void;
}

export default function ResultStep({ imageSrc, result, onRetake, onRegister }: ResultStepProps) {
    const imageRef = useRef<HTMLImageElement>(null);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

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

    return (
        <div className="camera-container theme-light theme-light-report">
            <CameraHeader
                title="영양제 분석 결과"
                theme="light"
                onBack={onRetake}
            />

            <div className="result-scroll">
                {/* Image Card with Pro-Ratio */}
                <div className="camera-content-center" style={{ padding: '0 20px 20px' }}>
                    <RatioBox>
                        <img
                            ref={imageRef}
                            src={imageSrc}
                            alt="Analyzed"
                            onLoad={handleImageLoad}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div className="scan-indicator">
                            <ScanText size={16} />
                            <span>스캔 완료</span>
                        </div>

                        {/* Bounding Boxes & Tags */}
                        {imageSize.width > 0 && result.displayData?.products?.map((obj, idx) => {
                            const img = imageRef.current;
                            if (!img) return null;

                            // Since we now capture in 3:4 and show in 3:4, 
                            // the scale should be straightforward based on displayed size.
                            const scaleX = imageSize.width / img.naturalWidth;
                            const scaleY = imageSize.height / img.naturalHeight;

                            const [x1, y1, x2, y2] = obj.box;
                            const boxWidth = (x2 - x1) * scaleX;
                            const boxHeight = (y2 - y1) * scaleY;
                            const boxLeft = x1 * scaleX;
                            const boxTop = y1 * scaleY;

                            return (
                                <React.Fragment key={idx}>
                                    <div style={{
                                        position: 'absolute',
                                        left: `${boxLeft}px`,
                                        top: `${boxTop}px`,
                                        width: `${boxWidth}px`,
                                        height: `${boxHeight}px`,
                                        border: `3px solid ${idx === 1 ? '#FFE082' : '#FF5722'}`,
                                        borderRadius: '12px',
                                        pointerEvents: 'none',
                                        zIndex: 10
                                    }}>
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
                                    </div>
                                    <div className="obj-tag-v2" style={{
                                        left: `${boxLeft}px`,
                                        top: `${boxTop}px`,
                                        zIndex: 20
                                    }}>
                                        {idx + 1}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </RatioBox>
                </div>

                {/* Detected List */}
                <div className="result-list-section">
                    <div className="section-title-row">
                        <h3 className="card-item-title" style={{ fontSize: '1.4rem', color: '#1A1A1A' }}>인식된 영양제</h3>
                        <span className="count-badge">{result.displayData?.objectCount || 0}개 발견</span>
                    </div>

                    {(result.displayData?.products || []).map((obj, idx) => (
                        <div key={idx} className="report-card">
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
                                {obj.barcode && (
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Info size={12} />
                                        코드: {obj.barcode}
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${obj.confidence * 100}%`,
                                            height: '100%',
                                            background: obj.confidence > 0.7 ? 'var(--cam-green)' : 'var(--cam-orange)',
                                            borderRadius: 10
                                        }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#333' }}>
                                        {Math.round(obj.confidence * 100)}%
                                    </span>
                                </div>

                                {obj.confidence > 0.7 ? (
                                    <div className="matching-pill">
                                        <ShieldCheck size={14} />
                                        정보가 정확합니다
                                    </div>
                                ) : (
                                    <div className="matching-pill warning-pill">
                                        <Info size={14} />
                                        확인이 필요해요
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="sticky-footer" style={{ borderTop: '1px solid #eee' }}>
                <div className="cam-btn-row" style={{ padding: '16px 20px', width: '100%' }}>
                    <ActionButton onClick={onRetake} variant="outline">
                        <RotateCcw size={20} />
                        <span>다시 촬영</span>
                    </ActionButton>
                    <ActionButton onClick={onRegister} variant="primary">
                        <span>리포트 보기</span>
                        <Check size={20} strokeWidth={3} />
                    </ActionButton>
                </div>
            </footer>
        </div>
    );
}
