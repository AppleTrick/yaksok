"use client";

import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface ReportHeaderProps {
    onBack: () => void;
    title: string;
    subtitle?: string;
}

export default function ReportHeader({ onBack, title, subtitle }: ReportHeaderProps) {
    return (
        <header className="report-header">
            <button className="report-back-btn" onClick={onBack} aria-label="Go back">
                <ArrowLeft size={20} />
            </button>
            <div className="report-title-section">
                <h1 className="report-title">{title}</h1>
                {subtitle && <p className="report-subtitle">{subtitle}</p>}
            </div>
            <div style={{ width: 40 }} /> {/* Spacer for symmetry */}
        </header>
    );
}
