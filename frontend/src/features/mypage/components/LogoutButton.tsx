import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '@/services/userService';
import Modal from '@/components/Modal';
import '../styles.css';

export default function LogoutButton() {
    const router = useRouter();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = async () => {
        setIsLogoutModalOpen(false);
        await logout(); // 서버 로그아웃 요청
        localStorage.removeItem("userName");
        router.push("/login");
    };

    const handleCancelLogout = () => {
        setIsLogoutModalOpen(false);
    };

    return (
        <div className="logout-section">
            <button className="logout-button-full" onClick={handleLogoutClick}>
                <LogOut size={18} />
                <span>로그아웃</span>
            </button>

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={handleCancelLogout}
                title="로그아웃 확인"
                type="confirm"
                onConfirm={handleConfirmLogout}
                onCancel={handleCancelLogout}
                confirmText="로그아웃"
                cancelText="취소"
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    padding: '1rem 0'
                }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--sub-background)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        color: 'var(--primary-color)'
                    }}>
                        <LogOut size={28} />
                    </div>
                    <p style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'var(--foreground-color)',
                        marginBottom: '0.5rem'
                    }}>
                        정말로 로그아웃 하시겠습니까?
                    </p>
                    <p style={{
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)'
                    }}>
                        로그아웃 하시면 다음 접속 시<br />
                        로그인이 다시 필요합니다.
                    </p>
                </div>
            </Modal>
        </div>
    );
}
