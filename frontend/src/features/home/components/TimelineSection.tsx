import React from 'react';
import { Sun, Moon, CheckCircle } from "lucide-react";
import { Schedule, isItemDue } from "@/features/notification/contexts/ScheduleContext";
import '../styles.css';

interface TimelineSectionProps {
    today: Date | null;
    schedules: Schedule[];
    onToggleItem: (scheduleId: string, itemId: string) => void;
}

export default function TimelineSection({ today, schedules, onToggleItem }: TimelineSectionProps) {
    const activeSchedules = schedules.filter(s => s.isActive);

    if (!today || activeSchedules.length === 0) {
        return (
            <section className="timeline-section">
                <div className="empty-slot" style={{ textAlign: 'center', padding: '2rem' }}>
                    <p>등록된 일정이 없습니다.</p>
                </div>
            </section>
        );
    }

    // Check if any schedule has due items to decide if we show "No schedule" message overall?
    // The original code rendered the map directly. If no items match isItemDue, it returned null.
    // If all return null, the container might be empty.

    const renderedSchedules = activeSchedules.map(schedule => {
        const dueItems = schedule.items.filter(item => isItemDue(item, today) && item.status !== 'stopped');
        if (dueItems.length === 0) return null;

        const hour = parseInt(schedule.rawTime.split(':')[0]);
        const isNight = hour >= 18;
        const isLunch = hour >= 12 && hour < 18;
        const SlotIcon = isNight ? Moon : Sun;
        const slotClass = isNight ? 'dinner' : (isLunch ? 'lunch' : 'morning');
        const slotName = isNight ? '저녁' : (isLunch ? '점심' : '아침');

        return (
            <div key={schedule.id} className="time-slot">
                <div className="slot-header">
                    <SlotIcon className={`slot-icon ${slotClass}`} size={20} />
                    <span className="slot-title">{slotName}</span>
                    <span className="slot-time">{schedule.time}</span>
                    <span className="slot-label" style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#9ca3af' }}>{schedule.label}</span>
                </div>

                {dueItems.map((item, idx) => {
                    return (
                        <div
                            key={`${item.id}-${idx}`} // Force unique key to prevent re-render issues
                            className={`med-card ${item.isTaken ? 'done' : ''}`}
                            onClick={() => onToggleItem(schedule.id, item.id)}
                        >
                            <div className={`med-checkbox ${item.isTaken ? 'checked' : ''}`}>
                                {item.isTaken && <CheckCircle size={24} color="#10b981" />}
                                {!item.isTaken && <input type="checkbox" readOnly checked={false} />}
                            </div>
                            <div className="med-info">
                                <h3>{item.name}</h3>
                                <p>{item.detail || '상세 정보 없음'}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    });

    // Check if everything was null (no items due today)
    const hasAnyContent = renderedSchedules.some(s => s !== null);

    return (
        <section className="timeline-section">
            {hasAnyContent ? renderedSchedules : (
                <div className="timeline-empty-state">
                    <Sun size={48} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <p className="empty-text-main">오늘 예정된 일정이 없어요</p>
                    <p className="empty-text-sub">편안한 하루 보내세요</p>
                </div>
            )}
        </section>
    );
}
