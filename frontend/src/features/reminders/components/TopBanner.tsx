import React from 'react';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import './styles.css';

interface TopBannerProps {
    remainingCount: number;
    userName?: string;
}

const TopBanner: React.FC<TopBannerProps> = ({ remainingCount, userName = '선희' }) => { // Default to user name from Home
    const [dateStr, setDateStr] = React.useState("");

    React.useEffect(() => {
        const now = new Date();
        setDateStr(`${now.getMonth() + 1}월 ${now.getDate()}일`);
    }, []);

    return (
        <div className="reminders-header">
            <div className="header-top">
                <span className="date-text">{dateStr} ({userName})</span>
                <Link href="/settings" className="settings-icon">
                    <Settings size={20} color="#1F2937" />
                </Link>
            </div>
            <h1 className="page-title">알림</h1>
        </div>
    );
};

export default TopBanner;
