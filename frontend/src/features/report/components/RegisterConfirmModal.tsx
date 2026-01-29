"use client";

import React from 'react';
import { Pill, X } from 'lucide-react';

interface Product {
    name: string;
}

interface RegisterConfirmModalProps {
    isOpen: boolean;
    products: Product[];
    onConfirm: () => void;
    onCancel: () => void;
    onClose: () => void;
}

export default function RegisterConfirmModal({ isOpen, products, onConfirm, onCancel, onClose }: RegisterConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="premium-modal-overlay">
            <div className="premium-modal-content">
                <button className="premium-modal-close" onClick={onClose} aria-label="Close modal">
                    <X size={20} />
                </button>
                <div className="premium-modal-icon-bg">
                    <Pill size={32} color="#FF5722" />
                </div>
                <h3 className="premium-modal-title">영양제 등록</h3>
                <p className="premium-modal-desc">
                    분석된 영양제를 내 리스트에 추가할까요?
                </p>
                <div className="premium-modal-chips">
                    {products.map((p, i) => (
                        <span key={i} className="premium-product-chip">{p.name}</span>
                    ))}
                </div>
                <div className="premium-modal-footer">
                    <button className="premium-modal-btn secondary" onClick={onCancel}>
                        나중에 하기
                    </button>
                    <button className="premium-modal-btn primary" onClick={onConfirm}>
                        지금 등록하기
                    </button>
                </div>
            </div>
        </div>
    );
}
