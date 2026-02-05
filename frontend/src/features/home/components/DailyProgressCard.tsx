"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import './progress.css';

interface DailyProgressProps {
    total?: number;
    taken?: number;
}

export default function DailyProgressCard({ total = 4, taken = 3 }: DailyProgressProps) {
    const percentage = total > 0 ? (taken / total) * 100 : 0;
    // Circle Config
    const headerHeight = 30;
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <section className="daily-progress-card hero-card">
            <div className="progress-info-section">
                <div className="progress-text-group">
                    <h2 className="hero-title">오늘의 복용</h2>
                    <p className="hero-desc">
                        오늘 예정된 <span className="highlight-text">{total}개</span> 중<br />
                        <span className="highlight-val">{taken}개</span>를 드셨어요.
                    </p>
                </div>

                <div className="gauge-wrapper">
                    <svg width={size} height={size} className="progress-ring">
                        {/* Track */}
                        <circle
                            className="progress-ring__circle--track"
                            stroke="var(--light-grey)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            r={radius}
                            cx={size / 2}
                            cy={size / 2}
                        />
                        {/* Indicator */}
                        <circle
                            className="progress-ring__circle--indicator"
                            stroke="var(--color-brand)"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            r={radius}
                            cx={size / 2}
                            cy={size / 2}
                            strokeDasharray={`${circumference} ${circumference}`}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="gauge-center-text">
                        <span className="percentage-val">{Math.round(percentage)}%</span>
                    </div>
                </div>
            </div>

            <div className="hero-actions">
                <Link href="/camera" className="btn btn-medium btn-primary full-width-btn">
                    내 영양제 찾으러가기
                    <ChevronRight size={18} />
                </Link>
            </div>
        </section>
    );
}
