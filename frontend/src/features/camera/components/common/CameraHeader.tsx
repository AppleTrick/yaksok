"use client";

import React from 'react';
import { ArrowLeft, X } from 'lucide-react';

interface CameraHeaderProps {
    title: string;
    onBack?: () => void;
    onClose?: () => void;
    stepInfo?: string;
    theme?: 'light' | 'dark';
}

export default function CameraHeader({ title, onBack, onClose, stepInfo, theme = 'dark' }: CameraHeaderProps) {
    const isDark = theme === 'dark';
    const iconColor = isDark ? 'white' : '#1A1A1A';

    return (
        <header className="cam-header-pwa">
            {onBack && (
                <button onClick={onBack} className="cam-btn-icon-circle" style={{ background: isDark ? '' : '#f1f5f9', border: isDark ? '' : 'none' }}>
                    <ArrowLeft color={iconColor} size={24} />
                </button>
            )}
            {onClose && !onBack && (
                <button onClick={onClose} className="cam-btn-icon-circle" style={{ background: isDark ? '' : '#f1f5f9', border: isDark ? '' : 'none' }}>
                    <X color={iconColor} size={24} />
                </button>
            )}

            <h1 className="cam-header-title" style={{ color: iconColor }}>{title}</h1>

            {stepInfo ? (
                <div className="cam-step-badge">{stepInfo}</div>
            ) : (
                <div style={{ width: 44 }}></div>
            )}
        </header>
    );
}
