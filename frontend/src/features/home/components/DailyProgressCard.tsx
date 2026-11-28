"use client";

interface DailyProgressProps {
    total: number;
    taken: number;
}

// 고리는 viewBox로 그려 카드 폭에 맞춰 늘고 준다 (home.css .hm-ring)
const R = 54;
const C = 2 * Math.PI * R;

export default function DailyProgressCard({ total, taken }: DailyProgressProps) {
    const percent = total > 0 ? Math.round((taken / total) * 100) : 0;

    return (
        <section className="hm-card hm-progress" aria-label="오늘의 복용">
            <div>
                <h2 className="hm-progress-label">오늘의 복용</h2>
                <p className="hm-progress-text">
                    오늘 예정된 <b>{total}개</b> 중<br />
                    <strong>{taken}개</strong>를 드셨어요.
                </p>
            </div>
            <div className="hm-ring" role="img" aria-label={`${percent}% 복용`}>
                <svg viewBox="0 0 120 120" aria-hidden="true">
                    <circle className="hm-ring-track" cx="60" cy="60" r={R} fill="none" strokeWidth="12" />
                    <circle className="hm-ring-bar" cx="60" cy="60" r={R} fill="none" strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={C} strokeDashoffset={C - (percent / 100) * C} />
                </svg>
                <span aria-hidden="true">{percent}%</span>
            </div>
        </section>
    );
}
