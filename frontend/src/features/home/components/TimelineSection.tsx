import React, { useState } from 'react';
import { Sun, Moon, Check, Pill } from "lucide-react";
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
                <div className="empty-state-modern">
                    <div className="empty-state-icon">
                        <Pill size={32} />
                    </div>
                    <h3 className="empty-state-title">등록된 일정이 없습니다</h3>
                    <p className="empty-state-desc">새로운 영양제를 등록하고<br />건강한 습관을 시작해보세요!</p>
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
                    <div className={`slot-icon-wrapper ${slotClass}`}>
                        <SlotIcon size={18} />
                    </div>
                    <div className="slot-header-text">
                        <span className="slot-title">{slotName}</span>
                        <span className="slot-time">{schedule.time}</span>
                    </div>
                </div>

                <div className="med-cards-container">
                    {dueItems.map((item, idx) => (
                        <div
                            key={`${item.id}-${idx}`}
                            className={`med-card-modern ${item.isTaken ? 'taken' : ''}`}
                            onClick={() => onToggleItem(schedule.id, item.id)}
                        >
                            <div className="med-card-left">
                                <div className={`med-checkbox-modern ${item.isTaken ? 'checked' : ''}`}>
                                    {item.isTaken ? (
                                        <Check size={16} strokeWidth={3} />
                                    ) : (
                                        <Pill size={16} />
                                    )}
                                </div>
                            </div>
                            <div className="med-card-content">
                                <h3 className={item.isTaken ? 'taken' : ''}>{item.name}</h3>
                                <p>{item.detail || '상세 정보 없음'}</p>
                            </div>
                            <div className="med-card-action">
                                <span className={`status-badge ${item.isTaken ? 'completed' : 'pending'}`}>
                                    {item.isTaken ? '완료' : '대기'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
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
