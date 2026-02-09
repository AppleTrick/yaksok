import React from 'react';
import { Cycle, CycleType } from '@/features/notification/types';
import './cycle-selector.css';

interface CycleSelectorProps {
    value: Cycle;
    onChange: (cycle: Cycle) => void;
}

const DAYS = [
    { label: '일', value: 0 },
    { label: '월', value: 1 },
    { label: '화', value: 2 },
    { label: '수', value: 3 },
    { label: '목', value: 4 },
    { label: '금', value: 5 },
    { label: '토', value: 6 },
];

const CycleSelector: React.FC<CycleSelectorProps> = ({ value, onChange }) => {
    const handleTypeChange = (type: CycleType) => {
        const newCycle: Cycle = { ...value, type };

        // Initialize defaults when switching types
        if (type === 'weekly' && !newCycle.daysOfWeek) {
            newCycle.daysOfWeek = [];
        }
        if (type === 'interval' && !newCycle.interval) {
            newCycle.interval = 2; // Default to every 2 days
            newCycle.startDate = new Date().toISOString().split('T')[0]; // Default start today
        }

        onChange(newCycle);
    };

    const toggleDay = (day: number) => {
        if (value.type !== 'weekly') return;

        const currentDays = value.daysOfWeek || [];
        const newDays = currentDays.includes(day)
            ? currentDays.filter(d => d !== day)
            : [...currentDays, day];

        onChange({ ...value, daysOfWeek: newDays.sort() });
    };

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const days = parseInt(e.target.value);
        if (!isNaN(days) && days > 0) {
            onChange({ ...value, interval: days });
        }
    };

    return (
        <div className="cycle-selector">
            <div className="cycle-tabs">
                {(['daily', 'weekly', 'interval'] as CycleType[]).map((type) => (
                    <button
                        key={type}
                        className={`cycle-tab ${value.type === type ? 'active' : ''}`}
                        onClick={() => handleTypeChange(type)}
                    >
                        {type === 'daily' && '매일'}
                        {type === 'weekly' && '요일 선택'}
                        {type === 'interval' && 'N일 간격'}
                    </button>
                ))}
            </div>

            <div className="cycle-content">
                {value.type === 'daily' && (
                    <p className="description">매일 복용합니다.</p>
                )}

                {value.type === 'weekly' && (
                    <div className="days-grid">
                        {DAYS.map((day) => (
                            <button
                                key={day.value}
                                className={`day-btn ${value.daysOfWeek?.includes(day.value) ? 'selected' : ''}`}
                                onClick={() => toggleDay(day.value)}
                            >
                                {day.label}
                            </button>
                        ))}
                    </div>
                )}

                {value.type === 'interval' && (
                    <div className="interval-input-group">
                        <label>
                            <input
                                type="number"
                                min="2"
                                value={value.interval || 2}
                                onChange={handleIntervalChange}
                                className="interval-input"
                            />
                            일 간격으로 복용
                        </label>
                        <p className="description">
                            오늘부터 {value.interval || 2}일마다 복용합니다.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CycleSelector;
