import React from 'react';

interface NutrientInfoProps {
    label: string;
    current: number;
    max: number;
    unit: string;
    statusColor: string;
}

const NutrientInfo: React.FC<NutrientInfoProps> = ({ label, current, max, unit, statusColor }) => {
    return (
        <div className="nutrient-info">
            <div className="nutrient-info-left">
                <span className="nutrient-label">{label}</span>
                <span className="nutrient-amount">일일 권장량 {max}{unit}</span>
            </div>
            <div className="nutrient-info-right">
                <span className="nutrient-current-value" style={{ color: statusColor }}>
                    {current}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> {unit}</span>
            </div>
        </div>
    );
};

export default NutrientInfo;
