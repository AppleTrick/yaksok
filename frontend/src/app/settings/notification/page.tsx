"use client";

import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, X, Check, Copy } from 'lucide-react';
import Link from 'next/link';

import ToggleSwitch from '@/components/ToggleSwitch';
import TimePicker from '@/components/TimePicker';
import { useNotificationSettings } from '@/features/notification/hooks/useNotificationSettings';
import '@/features/notification/components/styles.css';

export default function NotificationSettingsPage() {
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

                {/* 1. Notification Method */}
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

                {/* 2. DND Mode */}
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
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <TimePicker
                                        value={settings.dndStartTime}
                                        onChange={(val) => updateActions.updateDndTime('dndStartTime', val)}
                                    />
                                </div>
                            </div>
                            <div className="time-row">
                                <span>종료 시간</span>
                                <div style={{ width: '100%', maxWidth: '200px' }}>
                                    <TimePicker
                                        value={settings.dndEndTime}
                                        onChange={(val) => updateActions.updateDndTime('dndEndTime', val)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Developer Tools - FCM Token */}
                <section className="settings-card" style={{ marginTop: '1rem' }}>
                    <h2 className="card-title">개발자 도구</h2>
                    <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                        <span className="setting-label" style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                            FCM 토큰 (백엔드 테스트용)
                        </span>
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('fcmToken');
                                if (token) {
                                    navigator.clipboard.writeText(token);
                                    alert('FCM 토큰이 클립보드에 복사되었습니다!\n\n' + token);
                                } else {
                                    alert('FCM 토큰이 없습니다.\n알림 권한을 허용하고 푸시 알림을 켜주세요.');
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem',
                                backgroundColor: '#3B82F6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: '500',
                            }}
                        >
                            <Copy size={18} />
                            FCM 토큰 복사
                        </button>
                    </div>
                </section>

                {/* Info Box */}
                <div className="info-box" style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#F3F4F6', borderRadius: '12px', color: '#6B7280', fontSize: '0.9rem', textAlign: 'center' }}>
                    <p>알림 시간과 영양제 목록 수정은<br /><strong>'알림' 탭</strong>에서 카드를 눌러 설정할 수 있습니다.</p>
                </div>
            </div>
        </div>
    );
}
