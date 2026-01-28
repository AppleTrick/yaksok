import React from 'react';
import { COLORS } from '@/constants/colors';

interface DaySelectorProps {
    value: number[];
    onChange: (newDays: number[]) => void;
    disabled?: boolean;
}

export default function DaySelector({ value, onChange, disabled = false }: DaySelectorProps) {
    const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

    const handleToggle = (dayIndex: number) => {
        if (disabled) return;
        const newDays = value.includes(dayIndex)
            ? value.filter(d => d !== dayIndex)
            : [...value, dayIndex].sort();
        onChange(newDays);
    };

    return (
        <div className="day-selector-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                {WEEKDAYS.map((day, idx) => {
                    const isSelected = value.includes(idx);
                    return (
                        <button
                            key={idx}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleToggle(idx)}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                border: disabled && !isSelected ? `1px solid ${COLORS.lightGray}` : (isSelected ? 'none' : `1px solid ${COLORS.lightGray}`),
                                backgroundColor: isSelected ? COLORS.primary : COLORS.white,
                                color: isSelected ? COLORS.white : COLORS.mediumGray,
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                cursor: disabled ? 'default' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                opacity: disabled ? 0.7 : 1
                            }}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
            <div style={{ fontSize: '0.8rem', color: COLORS.mediumGray, marginTop: '8px', textAlign: 'right' }}>
                {value.length === 7 ? '매일 반복' : value.length === 0 ? '반복 없음' : '선택한 요일에만 반복'}
            </div>
        </div>
    );
}
