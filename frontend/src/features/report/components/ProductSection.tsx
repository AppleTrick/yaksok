"use client";

import React from 'react';
import { Pill, Sparkles } from 'lucide-react';

interface Product {
    name: string;
    confidence: number;
}

interface ProductSectionProps {
    products: Product[];
}

export default function ProductSection({ products }: ProductSectionProps) {
    return (
        <section className="report-section-wrap">
            <div className="section-title">
                <Pill size={20} className="icon" />
                <h2>인식된 영양제</h2>
                <span className="section-count">{products.length}개 발견</span>
            </div>

            <div className="product-list">
                {products.length > 0 ? products.map((product, idx) => (
                    <div key={idx} className="product-card-modern">
                        <div className="product-idx-modern">{idx + 1}</div>
                        <div className="product-info-modern">
                            <h3>{product.name}</h3>
                            <div className="confidence-meter">
                                <div
                                    className={`confidence-bar ${product.confidence > 0.7 ? 'high' : ''}`}
                                    style={{ width: `${product.confidence * 100}%` }}
                                />
                                <span className={`confidence-text ${product.confidence > 0.7 ? 'high' : ''}`}>
                                    신뢰도 {Math.round(product.confidence * 100)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="product-empty-modern">
                        <div className="empty-icon-circle">
                            <Sparkles size={32} />
                        </div>
                        <h3>인식된 제품이 없어요</h3>
                        <p>카메라를 영양제 정면을 향해 다시 촬영해 보세요.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
