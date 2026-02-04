"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { fetchUserInfo, UserInfo } from '@/services/userService';
import MyPageHeader from '@/features/mypage/components/MyPageHeader';
import ProfileCard from '@/features/mypage/components/ProfileCard';
import DiseaseInfoSection from '@/features/mypage/components/DiseaseInfoSection';
import MyPageMenu from '@/features/mypage/components/MyPageMenu';
import LogoutButton from '@/features/mypage/components/LogoutButton';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Lock } from 'lucide-react';
import '@/features/mypage/styles.css';

export default function SettingsPage() {
    const router = useRouter();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const loadUserInfo = async () => {
            const data = await fetchUserInfo();
            if (data) {
                setUserInfo(data);
                localStorage.setItem('userName', data.userDataResponse.name);
                setLoading(false);
            } else {
                setIsLoginModalOpen(true);
            }
        };

        loadUserInfo();
    }, []);

    const handleLoginRedirect = () => {
        setIsLoginModalOpen(false);
        router.replace('/login');
    };

    if (loading && !isLoginModalOpen) return <div className="mypage-container" style={{ padding: 20 }}>로딩 중...</div>;

    return (
        <div className="mypage-container">
            {!isLoginModalOpen && (
                <>
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
                </>
            )}

            <Modal
                isOpen={isLoginModalOpen}
                onClose={handleLoginRedirect}
                title="인증 확인"
                hideCloseButton={true}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '1.5rem 0'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        backgroundColor: 'var(--sub-background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1.5rem',
                        color: 'var(--primary-color)'
                    }}>
                        <Lock size={32} />
                    </div>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        marginBottom: '0.75rem',
                        color: 'var(--foreground-color)'
                    }}>
                        로그인이 필요한 서비스입니다
                    </h3>
                    <p style={{
                        fontSize: '0.95rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.5,
                        marginBottom: '2rem'
                    }}>
                        맞춤형 영양제 정보를 확인하시려면<br />
                        먼저 로그인을 진행해 주세요.
                    </p>
                    <Button
                        variant="primary"
                        size="large"
                        onClick={handleLoginRedirect}
                        style={{ width: '100%' }}
                    >
                        로그인하러 가기
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
