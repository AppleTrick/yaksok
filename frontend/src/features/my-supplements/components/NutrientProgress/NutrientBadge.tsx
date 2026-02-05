import React from 'react';

interface NutrientBadgeProps {
    status: 'normal' | 'sufficient' | 'excessive';
    percentage: number;
}

const NutrientBadge: React.FC<NutrientBadgeProps> = ({ status, percentage }) => {
    const statusText = {
        normal: '부족',
        sufficient: '충분',
        excessive: '과다'
    }[status];

    const statusClass = {
        normal: 'badge-status-normal',
        sufficient: 'badge-status-sufficient',
        excessive: 'badge-status-excessive'
    }[status];

    return (
        <div className="nutrient-footer">
            <span className={`nutrient-status-badge ${statusClass}`}>
                {statusText} ({Math.round(percentage)}%)
            </span>
        </div>
    );
};

export default NutrientBadge;
