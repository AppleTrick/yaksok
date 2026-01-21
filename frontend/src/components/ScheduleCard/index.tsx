import React from 'react';
import { Bell } from 'lucide-react';
import './styles.css';

export interface ScheduleItem {
    id: string;
    name: string;
    detail?: string;
}

interface ScheduleCardProps {
    time: string; // "오후 2:00"
    label?: string; // "1시간 후 복용"
    items: ScheduleItem[];
    status?: 'upcoming' | 'done' | 'missed';
    onAlarmClick?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
    time,
    label,
    items,
    status = 'upcoming',
    onAlarmClick
}) => {
    return (
        <div className={`schedule-card ${status}`}>
            <div className="schedule-header">
                <div className="time-info">
                    {label && <span className="time-label">{label}</span>}
                    <h3 className="time-text">{time}</h3>
                </div>
                <button className="alarm-btn" onClick={onAlarmClick}>
                    <Bell size={20} className={status === 'upcoming' ? 'active-bell' : ''} />
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
