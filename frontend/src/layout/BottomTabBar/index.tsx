"use client";

import Link from 'next/link';
import { Bell, Home, Pill, ScanLine, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { prefetchUserInfo } from '@/services/useUserInfo';
import './styles.css';

const HIDDEN = ['/camera', '/report', '/login', '/signup', '/find-password'];
const ITEMS = [
    { href: '/', icon: Home, label: '홈' },
    { href: '/my-supplements', icon: Pill, label: '내 영양제' },
    { href: '/camera', icon: ScanLine, label: '찍기', main: true },
    { href: '/reminders', icon: Bell, label: '알림' },
    { href: '/settings', icon: UserRound, label: '나' },
];

export default function BottomTabBar() {
    const pathname = usePathname();
    if (HIDDEN.includes(pathname)) return null;

    return (
        <nav className="bottom-tab-bar" aria-label="주요 메뉴">
            {ITEMS.map(({ href, icon: Icon, label, main }) => {
                const active = href === '/' ? pathname === '/' : pathname.startsWith(href) || (href === '/settings' && pathname.startsWith('/mypage'));
                return (
                    <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`tab-item ${active ? 'active' : ''} ${main ? 'main' : ''}`}
                        onPointerDown={href === '/settings' ? prefetchUserInfo : undefined}>
                        <span className="tab-icon"><Icon size={main ? 26 : 23} /></span>
                        {main ? <span className="tab-sr">{label}</span> : <span>{label}</span>}
                    </Link>
                );
            })}
        </nav>
    );
}
