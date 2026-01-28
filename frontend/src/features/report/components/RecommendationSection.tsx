"use client";

import React from 'react';
import { Shield, Zap, CheckCircle2, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface Interaction {
    type: 'tip' | 'warning';
    text: string;
}

interface DosageInfo {
    name: string;
    min: string;
    recommended: string;
    max: string;
    current: string;
    status: 'good' | 'warning' | 'danger';
}

interface RecommendationSectionProps {
    interactions: Interaction[];
    dosageInfo: DosageInfo[];
    productNotes: string[];
}

export default function RecommendationSection({ interactions, dosageInfo, productNotes }: RecommendationSectionProps) {
    return (
        <section className="report-section-wrap">
            <div className="section-title">
                <Shield size={20} className="icon" />
                <h2>섭취 권장사항</h2>
            </div>

            {/* Interaction Analysis */}
            <div className="subsection-header-modern">
                <Zap size={16} />
                <span>AI 상호작용 분석</span>
                <span className="premium-ai-badge">AI</span>
            </div>
            <div className="interaction-list">
                {interactions.map((rec, idx) => (
                    <div key={idx} className={`recommendation-card-modern ${rec.type}`}>
                        <div className="rec-icon-wrap">
                            {rec.type === 'tip' ? (
                                <CheckCircle2 size={18} color="#4CAF50" />
                            ) : (
                                <AlertTriangle size={18} color="#F59E0B" />
                            )}
                        </div>
                        <p>{rec.text}</p>
                    </div>
                ))}
            </div>

            {/* Dosage Statistics */}
            <div className="subsection-header-modern">
                <TrendingUp size={16} />
                <span>성분별 일일 권장량</span>
            </div>
            <div className="dosage-list-modern">
                {dosageInfo.map((item, idx) => {
                    // Simple percentage calculation for gauge position (dummy logic for visual)
                    const percent = 45; // Placeholder
                    return (
                        <div key={idx} className="dosage-card-modern">
                            <div className="dosage-top-modern">
                                <span className="dosage-name-modern">{item.name}</span>
                                <span className={`dosage-status-pill ${item.status}`}>
                                    {item.status === 'good' ? '적정' : item.status === 'warning' ? '주의' : '초과'}
                                </span>
                            </div>
                            <div className="dosage-viz-modern">
                                <div className="dosage-labels-modern">
                                    <span>최소 {item.min}</span>
                                    <span className="rec">권장 {item.recommended}</span>
                                    <span>상한 {item.max}</span>
                                </div>
                                <div className="dosage-track-modern">
                                    <div className="dosage-fill-active" style={{ width: `${percent}%` }} />
                                    <div className="dosage-marker-modern" style={{ left: `${percent}%` }}>
                                        <span className="marker-label">{item.current}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* General Notes */}
            <div className="subsection-header-modern">
                <Info size={16} />
                <span>제품 가이드</span>
            </div>
            <div className="product-guide-modern">
                {productNotes.map((note, idx) => (
                    <div key={idx} className="guide-item-modern">
                        <div className="guide-dot" />
                        <p>{note}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
