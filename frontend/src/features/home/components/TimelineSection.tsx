import { Sun, Moon, Check, Pill } from "lucide-react";
import { Schedule, isItemDue } from "@/features/notification/contexts/ScheduleContext";

interface TimelineSectionProps {
    today: Date | null;
    schedules: Schedule[];
    onToggleItem: (scheduleId: string, itemId: string) => void;
}

export default function TimelineSection({ today, schedules, onToggleItem }: TimelineSectionProps) {
    const activeSchedules = schedules.filter(s => s.isActive);

    if (!today || activeSchedules.length === 0) {
        return (
            <section className="hm-empty">
                <Pill size={36} aria-hidden="true" />
                <strong>등록된 일정이 없습니다</strong>
                <p>새로운 영양제를 등록하고<br />건강한 습관을 시작해보세요!</p>
            </section>
        );
    }

    // Check if any schedule has due items to decide if we show "No schedule" message overall?
    // The original code rendered the map directly. If no items match isItemDue, it returned null.
    // If all return null, the container might be empty.

    const renderedSchedules = activeSchedules.map(schedule => {
        const dueItems = schedule.items.filter(item => isItemDue(item, today) && item.status !== 'stopped');
        if (dueItems.length === 0) return null;

        const hour = parseInt(schedule.rawTime.split(':')[0]);
        const isNight = hour >= 18;
        const isLunch = hour >= 12 && hour < 18;
        const SlotIcon = isNight ? Moon : Sun;
        const slotClass = isNight ? 'night' : (isLunch ? 'lunch' : 'morning');
        const slotName = isNight ? '저녁' : (isLunch ? '점심' : '아침');

        return (
            <section key={schedule.id} className="hm-slot" aria-label={`${slotName} ${schedule.time}`}>
                <div className="hm-slot-head">
                    <span className={`hm-slot-icon ${slotClass}`} aria-hidden="true"><SlotIcon size={18} /></span>
                    <div>
                        <div className="hm-slot-title">{slotName}</div>
                        <div className="hm-slot-time">{schedule.time}</div>
                    </div>
                </div>
                <div className="hm-meds">
                    {dueItems.map((item, idx) => (
                        // 눌러서 먹음/안 먹음을 바꾼다. 버튼이라 키보드·화면 읽기에서도 쓸 수 있다
                        <button
                            type="button"
                            key={`${item.id}-${idx}`}
                            className="hm-med"
                            aria-pressed={item.isTaken}
                            onClick={() => onToggleItem(schedule.id, item.id)}
                        >
                            <span className="hm-med-check" aria-hidden="true">
                                {item.isTaken ? <Check size={16} strokeWidth={3} /> : <Pill size={16} />}
                            </span>
                            <span className="hm-med-body">
                                <span className="hm-med-name">{item.name}</span>
                                {item.detail && <span className="hm-med-detail">{item.detail}</span>}
                            </span>
                            <span className="hm-med-state">{item.isTaken ? '먹었어요' : '먹기'}</span>
                        </button>
                    ))}
                </div>
            </section>
        );
    });

    // Check if everything was null (no items due today)
    const hasAnyContent = renderedSchedules.some(s => s !== null);

    if (!hasAnyContent) {
        return (
            <section className="hm-empty">
                <Sun size={40} aria-hidden="true" />
                <strong>오늘 예정된 일정이 없어요</strong>
                <p>편안한 하루 보내세요</p>
            </section>
        );
    }

    return <>{renderedSchedules}</>;
}
