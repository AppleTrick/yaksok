"use client";

import React from 'react';
import { ScheduleItem } from '@/components/ScheduleCard';
import ScheduleCard from '@/components/ScheduleCard';
import TopBanner from './components/TopBanner';
import WaterCard from './components/WaterCard';
import './components/styles.css';

// Mock Data
const MOCK_SCHEDULES: {
    id: string;
    time: string;
    label: string;
    status: 'upcoming' | 'done' | 'missed';
    items: ScheduleItem[];
}[] = [
        {
            id: '1',
            time: '오후 2:00',
            label: '1시간 후 복용',
            status: 'upcoming',
            items: [
                { id: '1', name: '오메가3' },
                { id: '2', name: '비타민D' },
                { id: '3', name: '루테인' }
            ]
        },
        {
            id: '2',
            time: '오후 7:00',
            label: '저녁 식사 후',
            status: 'upcoming',
            items: [
                { id: '4', name: '혈압약' },
                { id: '5', name: '마그네슘' }
            ]
        }
    ];

export default function RemindersFeature() {
    return (
        <div className="reminders-container">
            {/* Top Banner */}
            <TopBanner remainingCount={3} />

            {/* Timeline */}
            <div className="timeline-list">
                {MOCK_SCHEDULES.map(schedule => (
                    <ScheduleCard
                        key={schedule.id}
                        time={schedule.time}
                        label={schedule.label}
                        items={schedule.items}
                        status={schedule.status}
                        onAlarmClick={() => alert(`${schedule.time} 알림 설정`)}
                    />
                ))}
            </div>

            {/* Water Tracking */}
            <div style={{ marginTop: '1.5rem' }}>
                <WaterCard />
            </div>
        </div>
    );
}
