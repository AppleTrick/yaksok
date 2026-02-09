import React, { useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import './styles.css';

interface TimePickerProps {
    value: string; // "HH:mm" (24-hour format)
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

type AmPm = '오전' | '오후';

const AM_PM_OPTIONS: AmPm[] = ['오전', '오후'];
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, i) => i * 5);
const ITEM_HEIGHT = 52; // Matching the new CSS

const PickerItem = React.memo(({
    label,
    isActive,
    onClick
}: {
    label: string | number;
    isActive: boolean;
    onClick: () => void;
}) => {
    return (
        <div
            className={`picker-item ${isActive ? 'selected' : ''}`}
            onClick={onClick}
        >
            {label}
        </div>
    );
});
PickerItem.displayName = "PickerItem";

const TimePicker: React.FC<TimePickerProps> = ({
    value = "09:00",
    onChange,
    label,
    disabled = false
}) => {
    // 1. Parsing and Derived State
    const parsed = useMemo(() => {
        const [h, m] = value.split(':').map(Number);
        const ampm: AmPm = h < 12 ? '오전' : '오후';
        let hour = h % 12;
        if (hour === 0) hour = 12;

        // Round to nearest 5 minutes
        const roundedMinute = Math.round(m / 5) * 5;
        const minute = roundedMinute >= 60 ? 55 : roundedMinute;

        return { ampm, hour, minute };
    }, [value]);

    const [activeState, setActiveState] = useState(parsed);
    const isProgrammaticScroll = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const ampmRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // 2. Sync State with Props (only when not interacting)
    useEffect(() => {
        if (!isProgrammaticScroll.current) {
            setActiveState(parsed);
        }
    }, [parsed]);

    // 3. Initial & Prop-based Scroll Positioning
    const scrollToTarget = useCallback((
        ref: React.RefObject<HTMLDivElement | null>,
        index: number,
        smooth = true
    ) => {
        if (!ref.current) return;
        isProgrammaticScroll.current = true;

        ref.current.scrollTo({
            top: index * ITEM_HEIGHT,
            behavior: smooth ? 'smooth' : 'auto'
        });

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            isProgrammaticScroll.current = false;
        }, 500);
    }, []);

    useLayoutEffect(() => {
        // Initial positioning without animation for better UX
        scrollToTarget(ampmRef, AM_PM_OPTIONS.indexOf(parsed.ampm), false);
        scrollToTarget(hourRef, HOUR_OPTIONS.indexOf(parsed.hour), false);
        scrollToTarget(minuteRef, MINUTE_OPTIONS.indexOf(parsed.minute), false);
    }, []); // Only once on mount

    // 4. Handle Interaction Updates
    const pushChanges = useCallback((newState: typeof parsed) => {
        let h = newState.hour;
        if (newState.ampm === '오후' && h < 12) h += 12;
        if (newState.ampm === '오전' && h === 12) h = 0;

        const hStr = h.toString().padStart(2, '0');
        const mStr = newState.minute.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    }, [onChange]);

    const handleScroll = (
        e: React.UIEvent<HTMLDivElement>,
        list: any[],
        type: keyof typeof parsed
    ) => {
        if (isProgrammaticScroll.current) return;

        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);

        if (index >= 0 && index < list.length) {
            const newValue = list[index];
            if (activeState[type] !== newValue) {
                const nextState = { ...activeState, [type]: newValue };
                setActiveState(nextState);
                pushChanges(nextState);
            }
        }
    };

    const handleItemClick = (
        ref: React.RefObject<HTMLDivElement | null>,
        list: any[],
        type: keyof typeof parsed,
        val: any
    ) => {
        if (disabled) return;
        const idx = list.indexOf(val);
        scrollToTarget(ref, idx, true);

        const nextState = { ...activeState, [type]: val };
        setActiveState(nextState);
        pushChanges(nextState);
    };

    return (
        <div className={`time-picker-wrapper ${disabled ? 'disabled' : ''}`}>
            {label && <div className="time-picker-label">{label}</div>}

            <div className="picker-columns">
                <div className="picker-highlight"></div>

                {/* AM/PM */}
                <div
                    className="picker-column"
                    ref={ampmRef}
                    onScroll={(e) => handleScroll(e, AM_PM_OPTIONS, 'ampm')}
                >
                    <div className="picker-spacer"></div>
                    {AM_PM_OPTIONS.map((opt) => (
                        <PickerItem
                            key={opt}
                            label={opt}
                            isActive={activeState.ampm === opt}
                            onClick={() => handleItemClick(ampmRef, AM_PM_OPTIONS, 'ampm', opt)}
                        />
                    ))}
                    <div className="picker-spacer"></div>
                </div>

                {/* Hour */}
                <div
                    className="picker-column"
                    ref={hourRef}
                    onScroll={(e) => handleScroll(e, HOUR_OPTIONS, 'hour')}
                >
                    <div className="picker-spacer"></div>
                    {HOUR_OPTIONS.map((h) => (
                        <PickerItem
                            key={h}
                            label={h.toString().padStart(2, '0')}
                            isActive={activeState.hour === h}
                            onClick={() => handleItemClick(hourRef, HOUR_OPTIONS, 'hour', h)}
                        />
                    ))}
                    <div className="picker-spacer"></div>
                </div>

                <div className="picker-separator">:</div>

                {/* Minute */}
                <div
                    className="picker-column"
                    ref={minuteRef}
                    onScroll={(e) => handleScroll(e, MINUTE_OPTIONS, 'minute')}
                >
                    <div className="picker-spacer"></div>
                    {MINUTE_OPTIONS.map((m) => (
                        <PickerItem
                            key={m}
                            label={m.toString().padStart(2, '0')}
                            isActive={activeState.minute === m}
                            onClick={() => handleItemClick(minuteRef, MINUTE_OPTIONS, 'minute', m)}
                        />
                    ))}
                    <div className="picker-spacer"></div>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
