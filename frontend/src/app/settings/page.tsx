"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserInfo, UserInfo } from '@/services/userService';
import MyPageHeader from '@/features/mypage/components/MyPageHeader';
import ProfileCard from '@/features/mypage/components/ProfileCard';
import DiseaseInfoSection from '@/features/mypage/components/DiseaseInfoSection';
import MyPageMenu from '@/features/mypage/components/MyPageMenu';
import LogoutButton from '@/features/mypage/components/LogoutButton';
import '@/features/mypage/styles.css';

export default function SettingsPage() {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const hasAlerted = useRef(false);

    useEffect(() => {
        const loadUserInfo = async () => {
            const data = await fetchUserInfo();
            if (data) {
                setUserInfo(data);
                localStorage.setItem('userName', data.userDataResponse.name);
            } else {
                if (!hasAlerted.current) {
                    hasAlerted.current = true;
                    alert("로그인이 필요한 서비스입니다.");
                    router.replace('/login');
                }
                return;
            }
            setLoading(false);
        };

        loadUserInfo();
    }, []);

    if (loading) return <div className="mypage-container" style={{ padding: 20 }}>로딩 중...</div>;

    return (
        <div className="mypage-container">
            <MyPageHeader />

            {userInfo && (
                <ProfileCard
                    userName={userInfo.userDataResponse.name}
                    email={userInfo.userDataResponse.email}
                />
            )}

            <DiseaseInfoSection diseases={userInfo?.userDiseases || []} />

            <MyPageMenu />

            <LogoutButton />
        </div>
    );
}
