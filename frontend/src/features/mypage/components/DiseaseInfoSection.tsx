import React from 'react';
import { Disease } from '@/services/userService';
import '../styles.css';

interface DiseaseInfoSectionProps {
    diseases: Disease[];
    loading?: boolean;
}

export default function DiseaseInfoSection({ diseases, loading = false }: DiseaseInfoSectionProps) {
    return (
        <div className="info-sections">
            <section className="info-section">
                <h2 className="section-title">내 질환 정보</h2>
                <div className="disease-tags">
                    {loading ? (
                        <span className="skeleton-line" style={{ width: '8rem', height: '1.9rem' }} aria-hidden="true" />
                    ) : diseases.length ? (
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
