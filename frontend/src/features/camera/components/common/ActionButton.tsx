"use client";

import React from 'react';

interface ActionButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline';
    className?: string;
    disabled?: boolean;
}

export default function ActionButton({ onClick, children, variant = 'primary', className = "", disabled }: ActionButtonProps) {
    const variantClass = `cam-btn-${variant}`;

    return (
        <button
            onClick={onClick}
            className={`cam-btn-base ${variantClass} ${className}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
