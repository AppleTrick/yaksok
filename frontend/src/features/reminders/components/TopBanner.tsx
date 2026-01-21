import React from 'react';

import { Settings } from 'lucide-react';
import Link from 'next/link';
import './styles.css';

interface TopBannerProps {
    remainingCount: number;
    userName?: string;
}

const TopBanner: React.FC<TopBannerProps> = ({ remainingCount, userName = '나' }) => {
    return (
        <div className="reminders-header">
            <div className="header-top">
                <span className="date-text">10월 24일 ({userName})</span>
                <Link href="/settings" className="settings-icon">
                    <Settings size={20} color="#1F2937" />
                </Link>
            </div>
            <h1 className="page-title">알림</h1>

            <div className="info-banner">
                <div className="info-icon">i</div>
                <p className="info-text">
                    오늘 챙겨야 할 약이<br />
                    <strong>{remainingCount}번 남았습니다.</strong>
                </p>
            </div>
        </div>
    );
};

export default TopBanner;
