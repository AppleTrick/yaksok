'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Sun, Moon, CheckCircle, LogOut } from "lucide-react";
import './styles.css';

export default function HomeFeature() {
    const router = useRouter();
    const [userName, setUserName] = useState("사용자");

    useEffect(() => {
        const storedName = localStorage.getItem("userName");
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    const handleLogout = () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userName");
            alert("로그아웃 되었습니다.");
            router.push("/login"); // 로그인 페이지로 이동
        }
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <div className="greeting-section">
                    <span className="greeting-sub">좋은 아침입니다,</span>
                    <h1 className="greeting-main">{userName} 님</h1>
                    <p className="greeting-desc">오늘도 건강 약속을 지켜보세요.</p>
                </div>
                <div className="profile-icon" onClick={handleLogout} style={{ cursor: 'pointer' }} title="로그아웃">
                    {/* Placeholder for Profile or Logout Icon */}
                    <LogOut size={20} color="#666" />
                </div>
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
