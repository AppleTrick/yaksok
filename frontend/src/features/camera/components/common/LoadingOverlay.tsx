"use client";

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface LoadingOverlayProps {
    visible: boolean;
    message?: string;
}

export default function LoadingOverlay({ visible, message = "분석 중..." }: LoadingOverlayProps) {
    if (!visible) return null;

    return (
        <div className="cam-loading-overlay">
            <div style={{ position: 'relative', width: 100, height: 100 }}>
                {/* 회전하는 외부 링 */}
                <Loader2
                    className="loading-spinner"
                    size={100}
                    color="#FF5722"
                    strokeWidth={1.5}
                />
                {/* 펄스 효과가 있는 중앙 원 */}
                <div
                    className="loading-ring-effect"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'rgba(255, 87, 34, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Sparkles
                        className="loading-center-icon"
                        size={28}
                        color="#FF5722"
                        fill="#FF5722"
                        style={{ transform: 'none' }}
                    />
                </div>
            </div>
            <p className="cam-loading-text">{message}</p>
        </div>
    );
}
