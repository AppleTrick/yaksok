"use client";

import { useState, useEffect } from "react";
import HomeHeader from "@/features/home/components/HomeHeader";
import DailyProgressCard from "@/features/home/components/DailyProgressCard";
import HomeActionCard from "@/features/home/components/HomeActionCard";
import TimelineSection from "@/features/home/components/TimelineSection";
import { useScheduleContext, isItemDue } from "@/features/notification/contexts/ScheduleContext";
import '@/features/home/styles.css';

// 시간대별 인사말 유틸리티 함수
const getGreeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return "상쾌한 아침을 시작하세요,";
  if (hour >= 11 && hour < 17) return "활기찬 오후 보내세요,";
  if (hour >= 17 && hour < 22) return "오늘 하루도 수고하셨어요,";
  return "편안한 밤 되세요,";
};

export default function Home() {
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

  // Schedule Logic for Progress Card
  const allDueItems = today ? schedules.flatMap(s =>
    s.items.filter(item => isItemDue(item, today) && item.status !== 'stopped')
  ) : [];
  const totalMeds = allDueItems.length;
  const takenMeds = allDueItems.filter(i => i.isTaken).length;
  const greetingText = today ? getGreeting(today) : "반갑습니다,";

  return (
    <div className="home-container">
      <HomeHeader
        userName={userName}
        greetingText={greetingText}
        isLoading={isLoading}
      />

      <DailyProgressCard total={totalMeds} taken={takenMeds} />

      <HomeActionCard />

      <TimelineSection
        today={today}
        schedules={schedules}
        onToggleItem={toggleItemTaken}
      />

      {/* Spacing for Bottom Tab Bar */}
      <div style={{ height: "100px" }}></div>
    </div>
  );
}
