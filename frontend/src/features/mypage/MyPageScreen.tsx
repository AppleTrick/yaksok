"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUserInfo } from '@/services/useUserInfo';
import MyPageHeader from './components/MyPageHeader';
import ProfileCard from './components/ProfileCard';
import DiseaseInfoSection from './components/DiseaseInfoSection';
import MyPageMenu from './components/MyPageMenu';
import LogoutButton from './components/LogoutButton';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Lock } from 'lucide-react';
import './styles.css';

// 설정 탭과 /mypage가 같은 화면을 쓴다.
// 화면 뼈대(머리글, 메뉴, 로그아웃)는 바로 그리고, 사용자 정보가 들어갈 곳만 받는 동안 비워 둔다.
export default function MyPageScreen() {
    const router = useRouter();
    const { userInfo, failed } = useUserInfo();

    const handleLoginRedirect = () => router.replace('/login');

    return (
        <div className="mypage-container">
            {!failed && (
                <>
                    <MyPageHeader />
                    {userInfo ? (
                        <ProfileCard userName={userInfo.userDataResponse.name} email={userInfo.userDataResponse.email} />
                    ) : (
                        <div className="profile-section" aria-busy="true" aria-label="내 정보를 불러오는 중">
                            <div className="profile-image-wrapper" />
                            <span className="skeleton-line" style={{ width: '6rem', height: '1.5rem' }} />
                            <span className="skeleton-line" style={{ width: '10rem', height: '0.9rem', marginTop: '0.5rem' }} />
                        </div>
                    )}
                    <DiseaseInfoSection diseases={userInfo?.userDiseases ?? []} loading={!userInfo} />
                    <MyPageMenu />
                    <LogoutButton />
                </>
            )}

            <Modal isOpen={failed} onClose={handleLoginRedirect} title="인증 확인" hideCloseButton={true}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1.5rem 0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', backgroundColor: 'var(--sub-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                        <Lock size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: 'var(--foreground-color)' }}>
                        로그인이 필요한 서비스입니다
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '2rem' }}>
                        맞춤형 영양제 정보를 확인하시려면<br />
                        먼저 로그인을 진행해 주세요.
                    </p>
                    <Button variant="primary" size="large" onClick={handleLoginRedirect} style={{ width: '100%' }}>
                        로그인하러 가기
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
