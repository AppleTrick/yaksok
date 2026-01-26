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
            <div style={{ position: 'relative', width: 80, height: 80 }}>
                <Loader2 className="animate-spin" size={80} color="#FF5722" strokeWidth={1.5} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <Sparkles size={24} color="#FF5722" fill="#FF5722" />
                </div>
            </div>
            <p className="cam-loading-text">{message}</p>
        </div>
    );
}
