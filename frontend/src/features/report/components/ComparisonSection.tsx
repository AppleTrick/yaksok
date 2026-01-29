"use client";

import React from 'react';
import { Scale, Info, Sparkles, AlertCircle } from 'lucide-react';

interface ComparisonItem {
    name: string;
    myAmount: string;
    newAmount: string;
    totalAmount: string;
    status: string; // 'good' | 'warning' | 'new'
}

interface ComparisonSectionProps {
    comparisonData: ComparisonItem[];
}

export default function ComparisonSection({ comparisonData }: ComparisonSectionProps) {
    return (
        <section className="report-section-wrap">
            <div className="section-title">
                <Scale size={20} className="icon" />
                <h2>기존 영양제와 비교</h2>
            </div>

            <div className="comparison-card-modern">
                <div className="comparison-table-header">
                    <span>성분</span>
                    <span>기존</span>
                    <span>추가</span>
                    <span>합계</span>
                </div>
                <div className="comparison-table-body">
                    {comparisonData.map((item, idx) => (
                        <div key={idx} className={`comparison-row-modern ${item.status}`}>
                            <span className="comp-name-modern">
                                {item.status === 'new' && <Sparkles size={14} className="status-icon new" />}
                                {item.status === 'warning' && <AlertCircle size={14} className="status-icon warning" />}
                                {item.name}
                            </span>
                            <span className="comp-val">{item.myAmount}</span>
                            <span className="comp-val add">{item.newAmount !== '0mg' ? `+${item.newAmount}` : '-'}</span>
                            <span className="comp-val total">{item.totalAmount}</span>
                        </div>
                    ))}
                </div>
                <div className="comparison-footer-note">
                    <Info size={14} />
                    <span>일일 상한섭취량을 초과하지 않도록 주의하세요</span>
                </div>
            </div>
        </section>
    );
}
