"use client";


import Link from 'next/link';
import { Home, Pill, Settings, Bell, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import './styles.css';

export default function BottomTabBar() {
    const pathname = usePathname();

    // Hide tab bar on camera and report page to allow full screen UI
    if (pathname === '/camera' || pathname === '/report') {
        return null;
    }

    const navItems = [
        { href: '/', icon: Home, label: '홈' },
        { href: '/my-supplements', icon: Pill, label: '내 영양제' },
        { href: '/reminders', icon: Bell, label: '알림' },
        { href: '/settings', icon: Settings, label: '설정' },
    ];

    return (

        <motion.nav
            className="bottom-tab-bar"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                    <Link key={item.href} href={item.href} className={`tab-item ${isActive ? 'active' : ''}`}>
                        <motion.div
                            className="tab-item-content"
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ y: -2 }}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                        >
                            <item.icon size={24} />
                            <span>{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="active-indicator"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </motion.div>
                    </Link>
                );
            })}
        </motion.nav>
    );
}
