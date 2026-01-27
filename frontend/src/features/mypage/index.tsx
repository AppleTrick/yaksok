'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Settings, User, Bell, LogOut, ShieldCheck } from 'lucide-react';
import { fetchUserInfo, UserInfo } from '@/services/userService';
import './styles.css';

import ProfileCard from './components/ProfileCard';

export default function MyPageFeature() {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserInfo = async () => {
            const data = await fetchUserInfo();
            if (data) {
                setUserInfo(data);
                localStorage.setItem('userName', data.userDataResponse.name);
            }
            setLoading(false);
        };

        loadUserInfo();
    }, []);

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("userName");
            router.push("/login");
        }
    };

    if (loading) return <div className="mypage-container" style={{ padding: 20 }}>로딩 중...</div>;

    return (
        <div className="mypage-container">
            <header className="mypage-header">
                <button onClick={() => router.back()} className="back-button">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">마이페이지</h1>
                <button onClick={() => router.push('/settings')} className="settings-button">
                    <Settings size={22} />
                </button>
            </header>

            {userInfo && (
                <ProfileCard
                    userName={userInfo.userDataResponse.name}
                    email={userInfo.userDataResponse.email}
                />
            )}

            <div className="info-sections">
                <section className="info-section">
                    <h2 className="section-title">내 질환 정보</h2>
                    <div className="disease-tags">
                        {userInfo?.userDiseases.length ? (
                            userInfo.userDiseases.map(d => (
                                <span key={d.id} className="disease-tag">{d.name}</span>
                            ))
                        ) : (
                            <p className="empty-text">등록된 질환 정보가 없습니다.</p>
                        )}
                    </div>
                </section>
            </div>

            <div className="menu-list">
                <div className="menu-item" onClick={() => router.push('/mypage/edit')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <User size={20} />
                        <span className="menu-label">내 정보 수정</span>
                    </div>
                    <ChevronRight size={18} color="#CBD5E1" />
                </div>
                <div className="menu-item" onClick={() => router.push('/mypage/security')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShieldCheck size={20} />
                        <span className="menu-label">계정 및 보안</span>
                    </div>
                    <ChevronRight size={18} color="#CBD5E1" />
                </div>
            </div>

            <div className="logout-section">
                <button className="logout-button-full" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>로그아웃</span>
                </button>
            </div>
        </div>
    );
}
