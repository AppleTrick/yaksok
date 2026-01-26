'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/lib/axios';
import { COLORS } from '@/constants/colors';
import { User, LogOut, ChevronLeft } from 'lucide-react';
import Button from '@/components/Button';
import './styles.css';

import ProfileCard from './components/ProfileCard';

export default function MyPageFeature() {
    const router = useRouter();
    const [userName, setUserName] = useState('사용자');
    const [email, setEmail] = useState('user@example.com'); // Mock Email for now

    useEffect(() => {
        const loadUserInfo = async () => {
            // 1. 로컬 스토리지에서 먼저 가져오기 (빠른 UI 표시)
            const storedName = localStorage.getItem('userName');
            if (storedName) {
                setUserName(storedName);
            }

            // 2. API에서 최신 데이터 가져오기
            try {
                // 직접 axios를 사용하거나 userService를 호출
                const response = await axios.get('/api/v1/user/me');
                if (response.data && response.data.success) {
                    const freshName = response.data.data.name;
                    setUserName(freshName);
                    localStorage.setItem('userName', freshName); // 로컬 스토리지 업데이트
                }
            } catch (error) {
                console.error("사용자 정보를 가져오는데 실패했습니다. 로컬 데이터나 기본값을 사용합니다.", error);
                // 토큰이 유효하지 않은 경우(401) 로그인 페이지로 리다이렉트 등을 고려해야 하지만, 현재 지침대로 유지합니다.
            }
        };

        loadUserInfo();
    }, []);

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            try {
                await axios.get('/api/v1/auth/logout');
                alert("로그아웃 되었습니다.");
            } catch (error) {
                console.error("로그아웃 요청 실패:", error);
                alert("로그아웃 중 오류가 발생했으나 로컬 로그아웃을 진행합니다.");
            } finally {
                localStorage.removeItem("userName");
                router.push("/login");
            }
        }
    };

    return (
        <div className="mypage-container">
            <header className="mypage-header">
                <button onClick={() => router.back()} className="back-button">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">마이페이지</h1>
                <div style={{ width: 24 }}></div> {/* Spacer for center alignment */}
            </header>

            <ProfileCard userName={userName} email={email} />

            <div className="menu-list">
                <div className="menu-item" onClick={() => router.push('/mypage/edit')}>
                    <span>내 정보 수정</span>
                </div>
                <div className="menu-item">
                    <span>알림 설정</span>
                </div>
                <div className="menu-item">
                    <span>고객센터</span>
                </div>
                <div className="menu-item" onClick={handleLogout}>
                    <span style={{ color: COLORS.error }}>로그아웃</span>
                </div>
            </div>
        </div>
    );
}
