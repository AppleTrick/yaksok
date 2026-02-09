"use client";

import React from 'react';

interface RatioBoxProps {
    children: React.ReactNode;
    overlay?: React.ReactNode;
    className?: string;
}

export default function RatioBox({ children, overlay, className = "" }: RatioBoxProps) {
    return (
        <div className={`camera-ratio-box ${className}`}>
            {children}
            {overlay && <div className="absolute inset-0 z-10">{overlay}</div>}
        </div>
    );
}
