'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS } from '@/constants/colors';
import { Camera, Sun, Moon, CheckCircle, User } from "lucide-react";
import DailyProgressCard from "./components/DailyProgressCard";
import { useScheduleContext, isItemDue } from "../notification/contexts/ScheduleContext";
import './styles.css';

// 시간대별 인사말 유틸리티 함수
const getGreeting = (date: Date): string => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 11) return "상쾌한 아침을 시작하세요,";
    if (hour >= 11 && hour < 17) return "활기찬 오후 보내세요,";
    if (hour >= 17 && hour < 22) return "오늘 하루도 수고하셨어요,";
    return "편안한 밤 되세요,";
};

export default function HomeFeature() {
    const router = useRouter();
    const [userName, setUserName] = useState("사용자");
    const [isLoading, setIsLoading] = useState(true);
    const { schedules, toggleItemTaken } = useScheduleContext();
    const [today, setToday] = useState<Date | null>(null);

    useEffect(() => {
        setToday(new Date());

        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. 로컬 스토리지에서 우선 로드 (빠른 초기 화면)
                const storedName = localStorage.getItem("userName");
                if (storedName) {
                    setUserName(storedName);
                    // 스토리지에 있으면 일단 로딩 해제, 백그라운드에서 최신화
                    setIsLoading(false);
                }

                // 2. 최신 데이터 동기화
                const { fetchUserName } = await import('@/services/userService');
                const user = await fetchUserName();
                if (user) {
                    setUserName(user.name);
                    localStorage.setItem("userName", user.name);
                }
            } catch (error) {
                console.error("Failed to load user data", error);
            } finally {
                // 스토리지 데이터가 없었을 경우 여기서 로딩 해제
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Schedule Logic
    const allDueItems = today ? schedules.flatMap(s =>
        s.items.filter(item => isItemDue(item, today))
    ) : [];
    const totalMeds = allDueItems.length;
    const takenMeds = allDueItems.filter(i => i.isTaken).length;
    const activeSchedules = schedules.filter(s => s.isActive);
    const greetingText = today ? getGreeting(today) : "반갑습니다,";

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="greeting-section">
                    <span className="greeting-sub">{greetingText}</span>
                    <h1 className="greeting-main">
                        {isLoading ? (
                            <span className="skeleton-loader" />
                        ) : (
                            `${userName} 님`
                        )}
                    </h1>
                    <p className="greeting-desc">오늘도 건강 약속을 지켜보세요.</p>
                </div>
                {/* HEAD's Profile Link */}
                {/* HEAD's Profile Link Removed per request */}
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
                {today && activeSchedules.length > 0 ? (
                    activeSchedules.map(schedule => {
                        // Filter items for this schedule
                        const dueItems = schedule.items.filter(item => isItemDue(item, today));

                        // If no items in this slot are due, maybe skip slot?
                        // Or show slot but empty? Let's skip slot if no items are due to keep it clean.
                        if (dueItems.length === 0) return null;

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

                                {dueItems.map(item => (
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
                                ))}
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
