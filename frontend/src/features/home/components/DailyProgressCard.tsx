"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import './progress.css';

interface DailyProgressProps {
    total?: number;
    taken?: number;
}

export default function DailyProgressCard({ total = 4, taken = 3 }: DailyProgressProps) {
    const percentage = Math.round((taken / total) * 100) || 0;

    return (
        <section className="daily-progress-card">
            <div className="progress-header">
                <h2>오늘의 복용</h2>
                <div className="badge">
                    <span>잘하고 있어요</span>
                </div>
            </div>

            <p className="progress-desc">꾸준히 잘하고 계세요! 💊</p>

            <div className="progress-content">
                <div className="donut-chart-wrapper">
                    <div
                        className="donut-chart"
                        style={{ background: `conic-gradient(var(--primary-color) ${percentage}%, #E5E7EB ${percentage}% 100%)` }}
                    >
                        <div className="donut-inner">
                            <span className="percentage-text">{percentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="progress-info">
                    <p>오늘 영양제 <span className="highlight-text">{total}개</span> 중</p>
                    <p><span className="highlight-text">{taken}개</span>를 드셨어요.</p>

                    <Link href="/my-supplements" className="view-record-btn">
                        <span>내 영양제</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>
            </div>
        </section>
    );
}
