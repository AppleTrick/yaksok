import React, { useEffect, useRef, useState, useCallback } from 'react';
import './styles.css';

interface TimePickerProps {
    value: string; // "HH:mm" (24-hour format)
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

type AmPm = '오전' | '오후';

// ✅ Move constants outside component
const AM_PM_OPTIONS: AmPm[] = ['오전', '오후'];
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);
const ITEM_HEIGHT = 40;

// ✅ Memoized Item Component
const PickerItem = React.memo(({
    label,
    value,
    isActive,
    onClick
}: {
    label: string | number;
    value: any;
    isActive: boolean;
    onClick: (val: any) => void;
}) => {
    return (
        <div
            className={`picker-item ${isActive ? 'selected' : ''}`}
            data-value={value}
            onClick={() => onClick(value)}
        >
            {label}
        </div>
    );
});
PickerItem.displayName = "PickerItem";

const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    label,
    disabled = false
}) => {
    // 1. Parsing initial value
    const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        const ampm: AmPm = h < 12 ? '오전' : '오후';
        let hour = h % 12;
        if (hour === 0) hour = 12;
        return { ampm, hour, minute: m };
    };

    const initialParsed = parseTime(value || "09:00");

    // NOTE: 'parsedTime' state is actually not strictly needed if we derive everything from 'value' prop
    // only if we wanted to control internal state separate from prop, but we want controlled component behavior.

    // We hold local "active" state to allow smooth scrolling without waiting for prop updates
    const [activeAmpm, setActiveAmpm] = useState<AmPm>(initialParsed.ampm);
    const [activeHour, setActiveHour] = useState<number>(initialParsed.hour);
    const [activeMinute, setActiveMinute] = useState<number>(initialParsed.minute);

    const [isDragging, setIsDragging] = useState(false);

    // Editing State (Temporarily Disabled as requested)
    // const [editingColumn, setEditingColumn] = useState<'hour' | 'minute' | null>(null);
    // const [inputValue, setInputValue] = useState("");

    // Column Refs
    const ampmRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // State Refs (Source of Truth for High Frequency Events)
    const activeStateRef = useRef({ ampm: initialParsed.ampm, hour: initialParsed.hour, minute: initialParsed.minute });

    // Interaction Refs
    const isProgrammaticScroll = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const rafRef = useRef<number | null>(null);

    // Sync state with prop value (only if not scrolling)
    useEffect(() => {
        const parsed = parseTime(value || "09:00");

        if (!isProgrammaticScroll.current && !isDragging) {
            setActiveAmpm(parsed.ampm);
            setActiveHour(parsed.hour);
            setActiveMinute(parsed.minute);
            activeStateRef.current = { ampm: parsed.ampm, hour: parsed.hour, minute: parsed.minute };
        }
    }, [value, isDragging]);


    // --- DATA SYNC LOGIC ---
    // This debounced effect listens to changes in active* state and pushes them to parent.
    // This separates high-frequency scroll updates (State) from expensive prop updates (Logic).
    useEffect(() => {
        // Prevent updates if we are in the middle of a programmatic scroll
        // However, we MUST allow updates if the user is just scrolling manually (isDragging) logic?
        // Actually, we should debounce but eventually fire.

        const timer = setTimeout(() => {
            // Ensure we are using the LATEST value from ref to be safe? 
            // Or just trust the state dependencies.
            // Using state is safer for effect dependencies.

            // Reconstruct 24h time
            let h = activeHour;
            if (activeAmpm === '오후' && h < 12) h += 12;
            if (activeAmpm === '오전' && h === 12) h = 0;

            const mStr = activeMinute.toString().padStart(2, '0');
            const hStr = h.toString().padStart(2, '0');
            const newTimeStr = `${hStr}:${mStr}`;

            if (value !== newTimeStr) {
                onChange(newTimeStr);
            }
        }, 150); // Small delay to coalesce rapid scroll events

        return () => clearTimeout(timer);
    }, [activeAmpm, activeHour, activeMinute, onChange, value]);


    // --- SCROLL HANDLER ---
    const handleScroll = useCallback((
        e: React.UIEvent<HTMLDivElement>,
        list: any[],
        type: 'ampm' | 'hour' | 'minute'
    ) => {
        // If we are auto-scrolling (e.g. click), ignore scroll events to avoid "fight" / flutter
        if (isProgrammaticScroll.current) return;

        const scrollTop = e.currentTarget.scrollTop;
        const index = Math.round(scrollTop / ITEM_HEIGHT);

        if (index < 0 || index >= list.length) return;

        const newValue = list[index];

        // Only update if changed
        if (activeStateRef.current[type] !== newValue) {
            // High-perf visual update via RAF
            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                // Update Ref
                const current = { ...activeStateRef.current };
                if (type === 'ampm') current.ampm = newValue;
                if (type === 'hour') current.hour = newValue;
                if (type === 'minute') current.minute = newValue;
                activeStateRef.current = current;

                // Update React State (Component Re-render)
                if (type === 'ampm') setActiveAmpm(newValue);
                if (type === 'hour') setActiveHour(newValue);
                if (type === 'minute') setActiveMinute(newValue);
            });
        }
    }, []);


    // --- CLICK HANDLER ---
    const handleItemClick = useCallback((
        ref: React.RefObject<HTMLDivElement | null>,
        value: any,
        list: any[],
        type: 'ampm' | 'hour' | 'minute'
    ) => {
        if (disabled || !ref.current) return;

        const idx = list.indexOf(value);
        if (idx === -1) return;

        const element = ref.current;
        if (!element) return;

        // Interaction Lock
        isProgrammaticScroll.current = true;
        setIsDragging(false); // Force dragging off

        // 1. Update State Immediately (Visual Feedback)
        const current = { ...activeStateRef.current };
        if (type === 'ampm') current.ampm = value;
        if (type === 'hour') current.hour = value;
        if (type === 'minute') current.minute = value;

        activeStateRef.current = current;
        if (type === 'ampm') setActiveAmpm(value);
        if (type === 'hour') setActiveHour(value);
        if (type === 'minute') setActiveMinute(value);

        // 2. Clear any pending scroll debounce from the effect ?? 
        // No, let the effect fire naturally, or force update?
        // Since we updated state, the effect will fire in 150ms. That is acceptable.

        // 3. Scroll Animation
        element.style.scrollSnapType = 'none'; // Unlock snap

        // Using RAF for smoother start
        requestAnimationFrame(() => {
            element.scrollTo({
                top: idx * ITEM_HEIGHT,
                behavior: 'smooth'
            });

            // Re-enable snap after animation
            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
                if (element) {
                    element.style.scrollSnapType = 'y mandatory';
                    isProgrammaticScroll.current = false;

                    // Force alignment just in case? No, smooth scroll is precise enough usually.
                }
            }, 600);
        });
    }, [disabled]);

    // Stable Handlers
    const onAmPmClick = useCallback((val: any) => handleItemClick(ampmRef, val, AM_PM_OPTIONS, 'ampm'), [handleItemClick]);
    const onHourClick = useCallback((val: any) => handleItemClick(hourRef, val, HOUR_OPTIONS, 'hour'), [handleItemClick]);
    const onMinuteClick = useCallback((val: any) => handleItemClick(minuteRef, val, MINUTE_OPTIONS, 'minute'), [handleItemClick]);


    return (
        <div className={`time-picker-wrapper ${disabled ? 'disabled' : ''}`}>
            {label && <div className="time-picker-label">{label}</div>}

            <div className={`picker-columns ${isDragging ? 'dragging' : ''}`}>
                <div className="picker-highlight"></div>

                {/* AM/PM */}
                <div
                    className="picker-column"
                    ref={ampmRef}
                    onScroll={(e) => handleScroll(e, AM_PM_OPTIONS, 'ampm')}
                    onTouchStart={() => {
                        isProgrammaticScroll.current = false;
                        setIsDragging(true);
                    }}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{ scrollSnapType: isDragging ? 'none' : 'y mandatory' }}
                >
                    <div className="picker-spacer"></div>
                    {AM_PM_OPTIONS.map((opt) => (
                        <PickerItem
                            key={opt}
                            value={opt}
                            label={opt}
                            isActive={activeAmpm === opt}
                            onClick={onAmPmClick}
                        />
                    ))}
                    <div className="picker-spacer"></div>
                </div>

                {/* Hour */}
                <div
                    className="picker-column"
                    ref={hourRef}
                    onScroll={(e) => handleScroll(e, HOUR_OPTIONS, 'hour')}
                    onMouseDown={() => {
                        // Mouse support for PC
                        isProgrammaticScroll.current = false;
                        setIsDragging(true);
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={() => {
                        isProgrammaticScroll.current = false;
                        setIsDragging(true);
                    }}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{ scrollSnapType: isDragging ? 'none' : 'y mandatory' }}
                // onClick={} REMOVE column click for direct input -> Input Mode Disabled
                >
                    <div className="picker-spacer"></div>
                    {HOUR_OPTIONS.map((h) => (
                        <PickerItem
                            key={h}
                            value={h}
                            label={h.toString().padStart(2, '0')}
                            isActive={activeHour === h}
                            onClick={onHourClick}
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
                    onMouseDown={() => {
                        isProgrammaticScroll.current = false;
                        setIsDragging(true);
                    }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onTouchStart={() => {
                        isProgrammaticScroll.current = false;
                        setIsDragging(true);
                    }}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{ scrollSnapType: isDragging ? 'none' : 'y mandatory' }}
                // onClick={} REMOVE input mode
                >
                    <div className="picker-spacer"></div>
                    {MINUTE_OPTIONS.map((m) => (
                        <PickerItem
                            key={m}
                            value={m}
                            label={m.toString().padStart(2, '0')}
                            isActive={activeMinute === m}
                            onClick={onMinuteClick}
                        />
                    ))}
                    <div className="picker-spacer"></div>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
