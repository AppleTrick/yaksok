import React from 'react';
import { Bell } from 'lucide-react';
import './styles.css';

export interface ScheduleItem {
    id: string;
    name: string;
    detail?: string;
    isTaken?: boolean;
}

interface ScheduleCardProps {
    time: string; // "오후 2:00"
    label?: string; // "1시간 후 복용"
    items: ScheduleItem[];
    status?: 'upcoming' | 'done' | 'missed';
    onAlarmClick?: (e: React.MouseEvent) => void;
    onCardClick?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
    time,
    label,
    items,
    status = 'upcoming',
    onAlarmClick,
    onCardClick
}) => {
    return (
        <div className={`schedule-card ${status}`} onClick={onCardClick}>
            <div className="schedule-header">
                <div className="time-info">
                    {label && <span className="time-label">{label}</span>}
                    <h3 className="time-text">{time}</h3>
                </div>
                <button className="alarm-btn" onClick={(e) => {
                    e.stopPropagation(); // Prevent card click
                    onAlarmClick?.(e);
                }}>
                    <Bell size={20} className={status === 'upcoming' ? 'active-bell' : 'inactive-bell'} />
                </button>
            </div>

            <div className="schedule-content">
                {items.length > 0 ? (
                    <div className="med-list">
                        {items.map((item, index) => (
                            <span key={item.id} className="med-name">
                                {item.name}
                                {index < items.length - 1 && ", "}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="no-meds">예정된 약이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default ScheduleCard;
