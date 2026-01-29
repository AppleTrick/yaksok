import React from 'react';
import { Disease } from '@/services/userService';
import '../styles.css';

interface DiseaseInfoSectionProps {
    diseases: Disease[];
}

export default function DiseaseInfoSection({ diseases }: DiseaseInfoSectionProps) {
    return (
        <div className="info-sections">
            <section className="info-section">
                <h2 className="section-title">내 질환 정보</h2>
                <div className="disease-tags">
                    {diseases.length ? (
                        diseases.map(d => (
                            <span key={d.id} className="disease-tag">{d.sickName}</span>
                        ))
                    ) : (
                        <p className="empty-text">등록된 질환 정보가 없습니다.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
