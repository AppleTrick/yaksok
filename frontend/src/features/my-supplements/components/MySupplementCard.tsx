import React from 'react';
import { Pill, ChevronRight } from 'lucide-react';
import { MedicationItem } from '@/features/notification/types';
import '../styles.css';

interface MySupplementCardProps {
    item: MedicationItem;
    onClick: (item: MedicationItem) => void;
    onDelete?: () => void; // Optional for now, maybe for "Edit" mode
}

const MySupplementCard: React.FC<MySupplementCardProps> = ({ item, onClick }) => {
    return (
        <div
            className={`my-supplement-card ${item.status === 'stopped' ? 'stopped' : ''}`}
            onClick={() => onClick(item)}
        >
            <div className="card-custom-icon">
                {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="supplement-img" />
                ) : (
                    <div className="placeholder-icon">
                        <Pill size={24} color="#FF5722" />
                    </div>
                )}
            </div>

            <div className="card-content">
                <h3 className="supplement-name">{item.name}</h3>
                <p className="supplement-efficacy">
                    {item.efficacy || " 정보 없음"}
                </p>
            </div>

            <div className="card-action">
                <ChevronRight size={20} color="#9CA3AF" />
            </div>
        </div>
    );
};

export default MySupplementCard;
