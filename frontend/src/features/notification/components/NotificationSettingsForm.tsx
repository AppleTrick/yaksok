"use client";

import React from 'react';
import { ArrowLeft, Plus, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

import ToggleSwitch from '@/components/ToggleSwitch';
import TimePicker from '@/components/TimePicker';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import './styles.css';

export default function NotificationSettingsForm() {
    const { settings, isLoading, updateActions } = useNotificationSettings();

    if (isLoading) {
        return <div className="loading-screen">설정을 불러오는 중입니다...</div>;
    }

    return (
        <div className="notification-settings-container">
            {/* Header */}
            <div className="settings-header">
                <Link href="/settings" className="icon-button">
                    <ArrowLeft size={24} color="#1F2937" />
                </Link>
                <h1 className="header-title">알림 설정</h1>
                <div style={{ width: 24 }}></div>
            </div>

            <div className="settings-content">
                {/* 1. Medication Schedules */}
                <section className="settings-card">
                    <h2 className="card-title">복용 시간 설정</h2>
                    <div className="schedule-list">
                        {settings.schedules.map((schedule) => (
                            <div key={schedule.id} className="schedule-item">
                                <div className="schedule-info">
                                    <span className="schedule-time">{schedule.time}</span>
                                    <span className="schedule-label">{schedule.label}</span>
                                </div>
                                <div className="schedule-actions">
                                    <ToggleSwitch
                                        checked={schedule.isEnabled}
                                        onChange={(checked) => updateActions.updateSchedule(schedule.id, { isEnabled: checked })}
                                    />
                                    {/* Edit Logic (Simple Prompt for now, better to use Modal later) */}
                                    <button
                                        className="action-icon-btn edit-btn"
                                        onClick={() => {
                                            const newTime = prompt("시간을 입력하세요 (HH:mm)", schedule.time);
                                            if (newTime) updateActions.updateSchedule(schedule.id, { time: newTime });
                                        }}
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        className="action-icon-btn delete-btn"
                                        onClick={() => {
                                            if (confirm('삭제하시겠습니까?')) updateActions.removeSchedule(schedule.id);
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="add-schedule-btn" onClick={updateActions.addSchedule}>
                        <Plus size={20} />
                        <span>시간 추가</span>
                    </button>
                </section>

                {/* 2. Notification Method */}
                <section className="settings-card">
                    <h2 className="card-title">알림 방식</h2>
                    <div className="setting-row">
                        <span className="setting-label">푸시 알림</span>
                        <ToggleSwitch
                            checked={settings.pushEnabled}
                            onChange={updateActions.togglePush}
                        />
                    </div>
                    <div className="setting-row">
                        <span className="setting-label">미복용 재알림</span>
                        <ToggleSwitch
                            checked={settings.missedNotification}
                            onChange={updateActions.toggleMissed}
                        />
                    </div>
                </section>

                {/* 3. DND Mode */}
                <section className="settings-card">
                    <div className="card-header-row">
                        <h2 className="card-title">방해 금지 모드</h2>
                        <ToggleSwitch
                            checked={settings.dndEnabled}
                            onChange={updateActions.toggleDnd}
                        />
                    </div>

                    {settings.dndEnabled && (
                        <div className="dnd-times animated-fade-in">
                            <div className="time-row">
                                <span>시작 시간</span>
                                <div style={{ width: 120 }}>
                                    <TimePicker
                                        value={settings.dndStartTime}
                                        onChange={(val) => updateActions.updateDndTime('dndStartTime', val)}
                                    />
                                </div>
                            </div>
                            <div className="time-row">
                                <span>종료 시간</span>
                                <div style={{ width: 120 }}>
                                    <TimePicker
                                        value={settings.dndEndTime}
                                        onChange={(val) => updateActions.updateDndTime('dndEndTime', val)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
