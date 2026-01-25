import React from 'react';
import '@/features/my-supplements/styles.css';

interface NutrientProgressBarProps {
    label: string;
    current: number;
    max: number;
    unit: string;
}

const NutrientProgressBar: React.FC<NutrientProgressBarProps> = ({
    label,
    current,
    max,
    unit
}) => {
    // Percentage calculation (capped at 100 for visual bar, but we can show color for over)
    const percentage = Math.min((current / max) * 100, 100);
    
    // Status Logic
    // If current > max: Warning (Red)
    // If current > max * 0.8: Good/High (Green/Teal)
    // Else: Normal (Blue)
    let statusColor = '#3B82F6'; // Blue-500 default
    let statusText = '적정';

    if (current > max) {
        statusColor = '#EF4444'; // Red-500
        statusText = '과다';
    } else if (current >= max * 0.8) {
        statusColor = '#10B981'; // Emerald-500
        statusText = '충분';
    } else {
         statusColor = '#3B82F6'; // Blue-500
         statusText = '부족';
    }

    // Dynamic width for the bar
    const barStyle = {
        width: `${percentage}%`,
        backgroundColor: statusColor,
    };

    return (
        <div className="nutrient-progress-item" style={{ marginBottom: '16px' }}>
            <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                <span className="nutrient-label" style={{ fontWeight: 600, color: '#374151' }}>{label}</span>
                <span className="nutrient-value" style={{ color: '#6B7280' }}>
                    <span style={{ fontWeight: 700, color: statusColor }}>{current}</span>
                    <span style={{ fontSize: '0.8rem' }}> / {max}{unit}</span>
                </span>
            </div>
            
            <div className="progress-track" style={{ 
                height: '10px', 
                backgroundColor: '#E5E7EB', 
                borderRadius: '999px', 
                overflow: 'hidden',
                position: 'relative' 
            }}>
                <div className="progress-fill" style={{
                    ...barStyle,
                    height: '100%',
                    borderRadius: '999px',
                    transition: 'width 0.5s ease-out'
                }} />
            </div>

             <div className="progress-footer" style={{ textAlign: 'right', marginTop: '4px' }}>
                 <span style={{ fontSize: '0.75rem', color: statusColor, fontWeight: 600 }}>
                    {statusText} ({Math.round((current / max) * 100)}%)
                 </span>
             </div>
        </div>
    );
};

export default NutrientProgressBar;
