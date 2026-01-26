import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { MedicationItem } from '@/features/notification/types';
import { isItemDue } from '@/features/notification/contexts/ScheduleContext';
import './styles.css';

interface ScheduleCardProps {
    time: string; // "오후 2:00"
    label?: string; // "1시간 후 복용"
    items: MedicationItem[];
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
    // Filter items that are due today
    const [dueItems, setDueItems] = useState<MedicationItem[]>([]);

    useEffect(() => {
        const today = new Date();
        const filtered = items.filter(item => isItemDue(item, today));
        setDueItems(filtered);
    }, [items]);

    // If no items are due today, maybe we shouldn't even show the card?
    // Or just show "No meds today"?
    // The prompt says "Cards show... filtering". Let's show the card but filtered list.

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
                {dueItems.length > 0 ? (
                    <div className="med-list">
                        {dueItems.map((item, index) => (
                            <span key={item.id} className="med-name">
                                {item.name}
                                {index < dueItems.length - 1 && ", "}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="no-meds">오늘 예정된 약이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

export default ScheduleCard;
