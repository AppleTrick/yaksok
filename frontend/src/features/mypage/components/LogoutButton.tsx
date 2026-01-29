import React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '@/services/userService';
import '../styles.css';

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        if (confirm("로그아웃 하시겠습니까?")) {
            await logout(); // 서버 로그아웃 요청
            localStorage.removeItem("userName");
            router.push("/login");
        }
    };

    return (
        <div className="logout-section">
            <button className="logout-button-full" onClick={handleLogout}>
                <LogOut size={18} />
                <span>로그아웃</span>
            </button>
        </div>
    );
}
