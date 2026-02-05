import React from 'react';
import NutrientInfo from './NutrientInfo';
import NutrientBar from './NutrientBar';
import NutrientBadge from './NutrientBadge';
import './styles.css';

interface NutrientProgressProps {
    label: string;
    current: number;
    max: number;
    unit: string;
}

const NutrientProgress: React.FC<NutrientProgressProps> = ({
    label,
    current,
    max,
    unit
}) => {
    // 1. Logic & Calculations
    const rawPercentage = (current / max) * 100;
    const visualPercentage = Math.min(rawPercentage, 100);

    // 2. Status Determination
    let status: 'normal' | 'sufficient' | 'excessive' = 'normal';
    let statusColor = '#3B82F6'; // Default Blue

    if (current > max) {
        status = 'excessive';
        statusColor = '#EF4444'; // Red
    } else if (current >= max * 0.8) {
        status = 'sufficient';
        statusColor = '#10B981'; // Emerald
    }

    return (
        <div className="nutrient-progress-group">
            <NutrientInfo
                label={label}
                current={current}
                max={max}
                unit={unit}
                statusColor={statusColor}
            />

            <NutrientBar
                percentage={visualPercentage}
                status={status}
            />

            <NutrientBadge
                status={status}
                percentage={rawPercentage}
            />
        </div>
    );
};

export default NutrientProgress;
export { NutrientInfo, NutrientBar, NutrientBadge };
