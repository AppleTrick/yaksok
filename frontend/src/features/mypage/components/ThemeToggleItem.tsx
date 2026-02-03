"use client";

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import '../styles.css';

export default function ThemeToggleItem() {
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="menu-item" onClick={toggleTheme}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                <span className="menu-label">
                    {theme === 'dark' ? '다크 모드' : '라이트 모드'}
                </span>
            </div>
            <div className={`theme-toggle-switch ${theme}`}>
                <div className="theme-toggle-circle"></div>
            </div>
        </div>
    );
}
