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
    return (
        <header className={`cam-header-pwa ${theme === 'dark' ? 'theme-dark-header' : ''}`}>
            {onBack && (
                <button onClick={onBack} className="cam-btn-icon-circle">
                    <ArrowLeft size={24} className="header-icon" />
                </button>
            )}
            {onClose && !onBack && (
                <button onClick={onClose} className="cam-btn-icon-circle">
                    <X size={24} className="header-icon" />
                </button>
            )}

            <h1 className="cam-header-title">{title}</h1>

            {stepInfo ? (
                <div className="cam-step-badge">{stepInfo}</div>
            ) : (
                <div style={{ width: 44 }}></div>
            )}
        </header>
    );
}
