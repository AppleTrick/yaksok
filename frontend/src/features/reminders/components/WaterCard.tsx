import React from 'react';
import { Droplet } from 'lucide-react'; // Using Droplet as water icon
import './styles.css';

const WaterCard: React.FC = () => {
    return (
        <div className="water-card">
            <div className="water-icon-circle">
                <Droplet size={24} fill="#FF7043" color="#FF7043" /> {/* Orange/Red tint as in design */}
            </div>
            <div className="water-info">
                <h3 className="water-title">물 충분히 마시기</h3>
                <p className="water-desc">오늘 물 2L 챙겨 드셔보세요.</p>
            </div>
        </div>
    );
};

export default WaterCard;
