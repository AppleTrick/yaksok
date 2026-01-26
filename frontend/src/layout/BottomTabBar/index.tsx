"use client";


import Link from 'next/link';
import { Home, Pill, Settings, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import './styles.css';

export default function BottomTabBar() {
    const pathname = usePathname();

    // Hide tab bar on camera page to allow full screen UI
    if (pathname === '/camera') {
        return null;
    }

    return (
        <nav className="bottom-tab-bar">
            <Link href="/" className={`tab-item ${pathname === '/' ? 'active' : ''}`}>
                <Home size={24} />
                <span>홈</span>
            </Link>
            <Link href="/my-supplements" className={`tab-item ${pathname === '/my-supplements' ? 'active' : ''}`}>
                <Pill size={24} />
                <span>내 영양제</span>
            </Link>
            <Link href="/reminders" className={`tab-item ${pathname === '/reminders' ? 'active' : ''}`}>
                <Bell size={24} />
                <span>알림</span>
            </Link>
            <Link href="/settings" className={`tab-item ${pathname === '/settings' ? 'active' : ''}`}>
                <Settings size={24} />
                <span>설정</span>
            </Link>
        </nav>
    );
}
