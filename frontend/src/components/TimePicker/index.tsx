import React, { useEffect, useRef, useState, useCallback } from 'react';
import './styles.css';

interface TimePickerProps {
    value: string; // "HH:mm" (24-hour format)
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

type AmPm = '오전' | '오후';

// ✅ Move constants outside component to avoid recreation and dependency issues
const AM_PM_OPTIONS: AmPm[] = ['오전', '오후'];
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i);
const ITEM_HEIGHT = 40;

// ✅ Memoized Item Component for High Performance
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

    const [parsedTime, setParsedTime] = useState(initialParsed);
    const [editingColumn, setEditingColumn] = useState<'hour' | 'minute' | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // Independent states for visual selection
    const [activeAmpm, setActiveAmpm] = useState<AmPm>(initialParsed.ampm);
    const [activeHour, setActiveHour] = useState<number>(initialParsed.hour);
    const [activeMinute, setActiveMinute] = useState<number>(initialParsed.minute);

    const inputRef = useRef<HTMLInputElement>(null);

    // Column Refs
    const ampmRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // Interaction Flags
    // Active state ref to avoid closure issues (Source of Truth for Observer)
    const activeStateRef = useRef({ ampm: initialParsed.ampm, hour: initialParsed.hour, minute: initialParsed.minute });

    const isProgrammaticScroll = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const rafRef = useRef<number | null>(null);

    // Sync state with prop value
    useEffect(() => {
        const parsed = parseTime(value || "09:00");
        setParsedTime(parsed);
        // Sync active state and ref if not scrolling
        if (!isProgrammaticScroll.current) {
            setActiveAmpm(parsed.ampm);
            setActiveHour(parsed.hour);
            setActiveMinute(parsed.minute);
            activeStateRef.current = { ampm: parsed.ampm, hour: parsed.hour, minute: parsed.minute };
        }
    }, [value]);

    useEffect(() => {
        if (editingColumn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingColumn]);

    // Update parent logic (Stable function)
    const updateTime = useCallback((newAmpm: AmPm, newHour: number, newMinute: number) => {
        let h = newHour;
        if (newAmpm === '오후' && h < 12) h += 12;
        if (newAmpm === '오전' && h === 12) h = 0;

        const mStr = newMinute.toString().padStart(2, '0');
        const hStr = h.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    }, [onChange]);


    // --- Visual State to Data Logic Sync ---
    // This effect ensures that visual changes eventually trigger the parent's onChange,
    // but without blocking the render loop during rapid scrolling.
    useEffect(() => {
        // Debounce update to parent
        const timer = setTimeout(() => {
            if (!isProgrammaticScroll.current) {
                // Construct time string from ACTIVE state
                let h = activeHour;
                if (activeAmpm === '오후' && h < 12) h += 12;
                if (activeAmpm === '오전' && h === 12) h = 0;

                const mStr = activeMinute.toString().padStart(2, '0');
                const hStr = h.toString().padStart(2, '0');
                onChange(`${hStr}:${mStr}`);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [activeAmpm, activeHour, activeMinute, onChange]);


    // --- Scroll Handler (Fluid Visuals & High Performance) ---
    // Optimized to ONLY update visual state. No heavy logic here.
    const handleScroll = useCallback((
        e: React.UIEvent<HTMLDivElement>,
        list: any[],
        type: 'ampm' | 'hour' | 'minute'
    ) => {
        // If auto-scrolling (click), ignore scroll events to prevent state jitter
        if (isProgrammaticScroll.current) return;

        const scrollTop = e.currentTarget.scrollTop;

        // Calculate the "center" index dynamically
        const index = Math.round(scrollTop / ITEM_HEIGHT);

        // Boundary check
        if (index < 0 || index >= list.length) return;

        const newValue = list[index];

        // 1. Immediate Visual Update (Only if changed)
        // Accessing ref is faster than state for "changed" check?
        // We use activeStateRef as a "previous value" cache to avoid set state churn.
        if (activeStateRef.current[type] !== newValue) {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);

            rafRef.current = requestAnimationFrame(() => {
                const current = { ...activeStateRef.current };
                if (type === 'ampm') current.ampm = newValue;
                if (type === 'hour') current.hour = newValue;
                if (type === 'minute') current.minute = newValue;
                activeStateRef.current = current;

                // React State Update (Triggers Re-render for Bold Effect)
                if (type === 'ampm') setActiveAmpm(newValue);
                if (type === 'hour') setActiveHour(newValue);
                if (type === 'minute') setActiveMinute(newValue);
            });
        }
    }, []);


    // --- Click Logic ---
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

        isProgrammaticScroll.current = true;
        setIsDragging(false);

        // Update Ref & State immediately
        const current = { ...activeStateRef.current };
        if (type === 'ampm') current.ampm = value;
        if (type === 'hour') current.hour = value;
        if (type === 'minute') current.minute = value;

        activeStateRef.current = current;
        if (type === 'ampm') setActiveAmpm(value);
        if (type === 'hour') setActiveHour(value);
        if (type === 'minute') setActiveMinute(value);

        // Immediate Data Update on click (Intentional user action)
        if (timerRef.current) clearTimeout(timerRef.current);
        updateTime(current.ampm, current.hour, current.minute);

        // Scroll animation
        element.style.scrollSnapType = 'none';
        requestAnimationFrame(() => {
            element.scrollTo({
                top: idx * ITEM_HEIGHT,
                behavior: 'smooth'
            });

            if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
            scrollTimeoutRef.current = setTimeout(() => {
                if (element) {
                    element.style.scrollSnapType = 'y mandatory';
                    isProgrammaticScroll.current = false;
                }
            }, 600);
        });
    }, [disabled, updateTime]); // dependencies

    // Stable handlers for PickerItem to hold memoization
    const onAmPmClick = useCallback((val: any) => handleItemClick(ampmRef, val, AM_PM_OPTIONS, 'ampm'), [handleItemClick]);
    const onHourClick = useCallback((val: any) => handleItemClick(hourRef, val, HOUR_OPTIONS, 'hour'), [handleItemClick]);
    const onMinuteClick = useCallback((val: any) => handleItemClick(minuteRef, val, MINUTE_OPTIONS, 'minute'), [handleItemClick]);


    // Input Handlers
    const handleColumnClickRaw = (type: 'hour' | 'minute') => {
        if (disabled) return;
        setEditingColumn(type);
        setInputValue("");
    };

    const handleInputBlur = () => {
        if (editingColumn && inputValue) {
            const num = parseInt(inputValue, 10);
            if (!isNaN(num)) {
                const current = { ...activeStateRef.current };
                if (editingColumn === 'hour') {
                    let validHour = Math.max(1, Math.min(12, num));
                    current.hour = validHour;
                    setActiveHour(validHour);
                    const idx = HOUR_OPTIONS.indexOf(validHour);
                    if (hourRef.current) hourRef.current.scrollTop = idx * ITEM_HEIGHT;
                } else {
                    let validMinute = Math.max(0, Math.min(59, num));
                    current.minute = validMinute;
                    setActiveMinute(validMinute);
                    const idx = MINUTE_OPTIONS.indexOf(validMinute);
                    if (minuteRef.current) minuteRef.current.scrollTop = idx * ITEM_HEIGHT;
                }
                activeStateRef.current = current;
                updateTime(current.ampm, current.hour, current.minute);
            }
        }
        setEditingColumn(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleInputBlur();
    };

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
                    onTouchStart={() => { isProgrammaticScroll.current = false; setIsDragging(true); }}
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
                    onTouchStart={() => { isProgrammaticScroll.current = false; setIsDragging(true); }}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{ scrollSnapType: isDragging ? 'none' : 'y mandatory' }}
                    onClick={() => !editingColumn && handleColumnClickRaw('hour')}
                >
                    <div className="picker-spacer"></div>
                    {editingColumn === 'hour' ? (
                        <div className="picker-input-overlay">
                            <input
                                ref={inputRef}
                                type="number"
                                className="picker-num-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleInputBlur}
                                onKeyDown={handleKeyDown}
                                placeholder={activeHour.toString()}
                            />
                        </div>
                    ) : (
                        HOUR_OPTIONS.map((h) => (
                            <PickerItem
                                key={h}
                                value={h}
                                label={h.toString().padStart(2, '0')}
                                isActive={activeHour === h}
                                onClick={onHourClick}
                            />
                        ))
                    )}
                    <div className="picker-spacer"></div>
                </div>

                <div className="picker-separator">:</div>

                {/* Minute */}
                <div
                    className="picker-column"
                    ref={minuteRef}
                    onScroll={(e) => handleScroll(e, MINUTE_OPTIONS, 'minute')}
                    onTouchStart={() => { isProgrammaticScroll.current = false; setIsDragging(true); }}
                    onTouchEnd={() => setIsDragging(false)}
                    style={{ scrollSnapType: isDragging ? 'none' : 'y mandatory' }}
                    onClick={() => !editingColumn && handleColumnClickRaw('minute')}
                >
                    <div className="picker-spacer"></div>
                    {editingColumn === 'minute' ? (
                        <div className="picker-input-overlay">
                            <input
                                ref={inputRef}
                                type="number"
                                className="picker-num-input"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={handleInputBlur}
                                onKeyDown={handleKeyDown}
                                placeholder={activeMinute.toString().padStart(2, '0')}
                            />
                        </div>
                    ) : (
                        MINUTE_OPTIONS.map((m) => (
                            <PickerItem
                                key={m}
                                value={m}
                                label={m.toString().padStart(2, '0')}
                                isActive={activeMinute === m}
                                onClick={onMinuteClick}
                            />
                        ))
                    )}
                    <div className="picker-spacer"></div>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
