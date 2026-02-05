import React from 'react';
import { motion } from 'framer-motion';

interface NutrientBarProps {
    percentage: number;
    status: 'normal' | 'sufficient' | 'excessive';
}

const NutrientBar: React.FC<NutrientBarProps> = ({ percentage, status }) => {
    const statusClass = {
        normal: 'bar-status-normal',
        sufficient: 'bar-status-sufficient',
        excessive: 'bar-status-excessive'
    }[status];

    return (
        <div className="nutrient-bar-container">
            <motion.div
                className={`nutrient-bar-fill ${statusClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
            />
        </div>
    );
};

export default NutrientBar;
