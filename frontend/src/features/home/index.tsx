'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COLORS } from '@/constants/colors';
import { Camera, Sun, Moon, CheckCircle, User } from "lucide-react";
import './styles.css';

export default function HomeFeature() {
    const router = useRouter();
    const [userName, setUserName] = useState("사용자");

    useEffect(() => {
        // 1. 로컬 스토리지에서 초기 로드
        const storedName = localStorage.getItem("userName");
        if (storedName) {
            setUserName(storedName);
        } else {
            // 이름이 없어도 쿠키가 있다면 로그인 상태일 수 있음
        }

        // 2. 최신 데이터 가져오기 및 세션 확인
        const syncUserInfo = async () => {
            // userService 동적 임포트
            const { fetchUserInfo } = await import('@/services/userService');
            const userInfo = await fetchUserInfo();

            if (userInfo) {
                setUserName(userInfo.name);
                localStorage.setItem("userName", userInfo.name);
            } else {
                // API 실패 시(예: 401) 로그인 페이지로 리다이렉트 고려
                // 하지만 "개발 단계이므로 리다이렉트 주석 처리" 요청에 따름
                // console.log("로그인되지 않았거나 API 오류 발생");
                // if (!storedName) router.push('/login'); // 요청에 따라 주석 처리
            }
        };

        syncUserInfo();
    }, []);

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="greeting-section">
                    <span className="greeting-sub">좋은 아침입니다,</span>
                    <h1 className="greeting-main">{userName} 님</h1>
                    <p className="greeting-desc">오늘도 건강 약속을 지켜보세요.</p>
                </div>
                <Link href="/mypage">
                    <div className="profile-icon" title="마이페이지">
                        <User size={28} color={COLORS.black} />
                    </div>
                </Link>
            </header>

            {/* Main Action Card: Register Supplement */}
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

            {/* Daily Timeline */}
            <section className="timeline-section">
                {/* Morning */}
                <div className="time-slot">
                    <div className="slot-header">
                        <Sun className="slot-icon morning" size={20} />
                        <span className="slot-title">아침</span>
                        <span className="slot-time">오전 8:00</span>
                    </div>
                    <div className="med-card">
                        <div className="med-checkbox">
                            <input type="checkbox" id="med1" />
                            <label htmlFor="med1"></label>
                        </div>
                        <div className="med-info">
                            <h3>비타민 C (1000mg)</h3>
                            <p>물과 함께 복용</p>
                        </div>
                    </div>
                    <div className="med-card done">
                        <div className="med-checkbox checked">
                            <CheckCircle size={24} color="#10b981" />
                        </div>
                        <div className="med-info">
                            <h3>오메가3</h3>
                            <p>1 캡슐</p>
                        </div>
                    </div>
                </div>

                {/* Lunch */}
                <div className="time-slot">
                    <div className="slot-header">
                        <Sun className="slot-icon lunch" size={20} />
                        <span className="slot-title">점심</span>
                        <span className="slot-time">오후 12:30</span>
                    </div>
                    <div className="med-card">
                        <div className="med-checkbox">
                            <input type="checkbox" id="med3" />
                            <label htmlFor="med3"></label>
                        </div>
                        <div className="med-info">
                            <h3>유산균</h3>
                            <p>식후 30분 뒤 복용</p>
                        </div>
                    </div>
                </div>

                {/* Dinner */}
                <div className="time-slot">
                    <div className="slot-header">
                        <Moon className="slot-icon dinner" size={20} />
                        <span className="slot-title">저녁</span>
                    </div>
                    <div className="empty-slot">
                        <Moon size={40} className="empty-icon" />
                        <p>예정된 영양제가 없습니다.</p>
                        <span>편안한 저녁 시간 되세요.</span>
                    </div>
                </div>
            </section>

            {/* Spacing for Bottom Tab Bar */}
            <div style={{ height: "100px" }}></div>
        </div>
    );
}
