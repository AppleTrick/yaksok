import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, User, Bell, ShieldCheck } from 'lucide-react';
import '../styles.css';
import ThemeToggleItem from './ThemeToggleItem';

export default function MyPageMenu() {
    const router = useRouter();

    return (
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
            <div className="menu-item" onClick={() => router.push('/settings/notification')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bell size={20} />
                    <span className="menu-label">알림 설정</span>
                </div>
                <ChevronRight size={18} color="#CBD5E1" />
            </div>
            <ThemeToggleItem />
        </div>
    );
}
