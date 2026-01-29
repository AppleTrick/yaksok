import React from 'react';
import '../styles.css';

interface HomeHeaderProps {
    userName: string;
    greetingText: string;
    isLoading: boolean;
}

export default function HomeHeader({ userName, greetingText, isLoading }: HomeHeaderProps) {
    return (
        <header className="home-header">
            <div className="greeting-section">
                <span className="greeting-sub">{greetingText}</span>
                <h1 className="greeting-main">
                    {isLoading ? (
                        <span className="skeleton-loader" />
                    ) : (
                        `${userName} 님`
                    )}
                </h1>
                <p className="greeting-desc">오늘도 건강 약속을 지켜보세요.</p>
            </div>
        </header>
    );
}
