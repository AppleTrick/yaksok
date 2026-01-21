"use client";

import Link from "next/link";
import { Camera, Sun, Moon, CheckCircle } from "lucide-react";
import DailyProgressCard from "./components/DailyProgressCard";
import { useScheduleContext } from "../notification/contexts/ScheduleContext";
import './styles.css';

export default function HomeFeature() {
    const { schedules, toggleItemTaken } = useScheduleContext();

    // 1. Calculate Progress from Context
    const allItems = schedules.flatMap(s => s.items);
    const totalMeds = allItems.length;
    const takenMeds = allItems.filter(i => i.isTaken).length;

    // 2. Sort/Filter Logic
    // In a real app we might filter by time of day, but for now we iterate the schedules directly.
    const activeSchedules = schedules.filter(s => s.isActive);

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="greeting-section">
                    <span className="greeting-sub">좋은 아침입니다,</span>
                    <h1 className="greeting-main">선희 님</h1>
                    <p className="greeting-desc">오늘도 건강 약속을 지켜보세요.</p>
                </div>
                <div className="header-actions">
                    <div className="profile-icon">
                        <div className="profile-placeholder">S</div>
                    </div>
                </div>
            </header>

            {/* Daily Progress Card */}
            <DailyProgressCard total={totalMeds} taken={takenMeds} />

            {/* Main Action Card */}
            <section className="action-card">
                <div className="action-text">
                    <h2>영양제 등록하기</h2>
                    <p>새 영양제를 촬영해 등록하세요</p>
                </div>
                <Link href="/camera" className="action-button">
                    <Camera size={20} />
                    <span>지금 촬영하기</span>
                </Link>
            </section>

            {/* Daily Timeline (Connected to Context) */}
            <section className="timeline-section">
                {activeSchedules.length > 0 ? (
                    activeSchedules.map(schedule => {
                        // Simple logic to determine icon based on time
                        // Assuming rawTime is "HH:MM" 24h format
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

                                {schedule.items.length > 0 ? (
                                    schedule.items.map(item => (
                                        <div
                                            key={item.id}
                                            className={`med-card ${item.isTaken ? 'done' : ''}`}
                                            onClick={() => toggleItemTaken(schedule.id, item.id)}
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
                                    ))
                                ) : (
                                    <p className="empty-text">등록된 영양제가 없습니다.</p>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-slot" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p>등록된 일정이 없습니다.</p>
                    </div>
                )}
            </section>

            {/* Spacing for Bottom Tab Bar */}
            <div style={{ height: "100px" }}></div>
        </div>
    );
}
