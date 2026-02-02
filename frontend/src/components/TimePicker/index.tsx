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


    /**
     * ✅ Partial Update Logic wrapped in useCallback
     */
    const triggerUpdate = useCallback((type: 'ampm' | 'hour' | 'minute', value: any) => {
        // 1. Get Latest State from Ref
        const current = { ...activeStateRef.current };

        // 2. Apply Change
        if (type === 'ampm') current.ampm = value;
        if (type === 'hour') current.hour = value;
        if (type === 'minute') current.minute = value;

        // 3. Update Ref immediately
        activeStateRef.current = current;

        // 4. Update Visual State (so UI reflects immediately)
        if (type === 'ampm') setActiveAmpm(value);
        if (type === 'hour') setActiveHour(value);
        if (type === 'minute') setActiveMinute(value);

        // 5. Debounce Parent Update
        if (isProgrammaticScroll.current) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            updateTime(current.ampm, current.hour, current.minute);
        }, 150);
    }, [updateTime]); // Dependencies: updateTime (which depends on onChange)


    // Intersection Observer Logic
    useEffect(() => {
        if (disabled) return;

        const createObserver = (
            root: HTMLDivElement,
            optionsList: any[],
            type: 'ampm' | 'hour' | 'minute'
        ) => {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            const val = entry.target.getAttribute('data-value');
                            if (val) {
                                let parsedVal: any = val;
                                if (typeof optionsList[0] === 'number') {
                                    parsedVal = Number(val);
                                }
                                triggerUpdate(type, parsedVal);
                            }
                        }
                    });
                },
                {
                    root: root,
                    rootMargin: '-50% 0px -50% 0px', // Center line detection
                    threshold: 0
                }
            );
            return observer;
        };

        const observers: IntersectionObserver[] = [];

        if (ampmRef.current) {
            const observer = createObserver(ampmRef.current, AM_PM_OPTIONS, 'ampm');
            Array.from(ampmRef.current.children).forEach(child => {
                if (child.classList.contains('picker-item')) observer.observe(child);
            });
            observers.push(observer);
        }

        if (hourRef.current) {
            const observer = createObserver(hourRef.current, HOUR_OPTIONS, 'hour');
            Array.from(hourRef.current.children).forEach(child => {
                if (child.classList.contains('picker-item')) observer.observe(child);
            });
            observers.push(observer);
        }

        if (minuteRef.current) {
            const observer = createObserver(minuteRef.current, MINUTE_OPTIONS, 'minute');
            Array.from(minuteRef.current.children).forEach(child => {
                if (child.classList.contains('picker-item')) observer.observe(child);
            });
            observers.push(observer);
        }

        return () => {
            observers.forEach(obs => obs.disconnect());
        };
    }, [disabled, triggerUpdate]); // ✅ Added triggerUpdate to dependencies


    // Initial Scroll Position
    useEffect(() => {
        const initScroll = (ref: React.RefObject<HTMLDivElement | null>, list: any[], val: any) => {
            if (ref.current) {
                const idx = list.indexOf(val);
                if (idx >= 0) ref.current.scrollTop = idx * ITEM_HEIGHT;
            }
        };
        initScroll(ampmRef, AM_PM_OPTIONS, parsedTime.ampm);
        initScroll(hourRef, HOUR_OPTIONS, parsedTime.hour);
        initScroll(minuteRef, MINUTE_OPTIONS, parsedTime.minute);
    }, []); // Empty deps is intended for mount only (using parsedTime from closure is safe for initial render)


    // --- Click & Scroll Logic ---

    const handleItemClick = (
        ref: React.RefObject<HTMLDivElement | null>,
        value: any,
        list: any[],
        type: 'ampm' | 'hour' | 'minute'
    ) => {
        if (disabled || !ref.current) return;

        const idx = list.indexOf(value);
        if (idx === -1) return;

        const element = ref.current;
        if (!element) return; // 추가 안전 체크

        isProgrammaticScroll.current = true;

        element.style.scrollSnapType = 'none';

        element.scrollTo({
            top: idx * ITEM_HEIGHT,
            behavior: 'smooth'
        });

        // Manual Update (using ref for stability)
        const current = { ...activeStateRef.current };
        if (type === 'ampm') current.ampm = value;
        if (type === 'hour') current.hour = value;
        if (type === 'minute') current.minute = value;
        activeStateRef.current = current;

        if (type === 'ampm') setActiveAmpm(value);
        if (type === 'hour') setActiveHour(value);
        if (type === 'minute') setActiveMinute(value);

        updateTime(current.ampm, current.hour, current.minute);

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            const currentElement = ref.current;
            if (currentElement) {
                currentElement.style.scrollSnapType = 'y mandatory';
                isProgrammaticScroll.current = false;
            }
        }, 500);
    };


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

            <div className="picker-columns">
                <div className="picker-highlight"></div>

                {/* AM/PM */}
                <div className="picker-column" ref={ampmRef}>
                    <div className="picker-spacer"></div>
                    {AM_PM_OPTIONS.map((opt) => (
                        <div
                            key={opt}
                            className={`picker-item ${activeAmpm === opt ? 'selected' : ''}`}
                            data-value={opt}
                            onClick={() => handleItemClick(ampmRef, opt, AM_PM_OPTIONS, 'ampm')}
                        >
                            {opt}
                        </div>
                    ))}
                    <div className="picker-spacer"></div>
                </div>

                {/* Hour */}
                <div
                    className="picker-column"
                    ref={hourRef}
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
                            <div
                                key={h}
                                className={`picker-item ${activeHour === h ? 'selected' : ''}`}
                                data-value={h}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(hourRef, h, HOUR_OPTIONS, 'hour');
                                }}
                            >
                                {h.toString().padStart(2, '0')}
                            </div>
                        ))
                    )}
                    <div className="picker-spacer"></div>
                </div>

                <div className="picker-separator">:</div>

                {/* Minute */}
                <div
                    className="picker-column"
                    ref={minuteRef}
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
                            <div
                                key={m}
                                className={`picker-item ${activeMinute === m ? 'selected' : ''}`}
                                data-value={m}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(minuteRef, m, MINUTE_OPTIONS, 'minute');
                                }}
                            >
                                {m.toString().padStart(2, '0')}
                            </div>
                        ))
                    )}
                    <div className="picker-spacer"></div>
                </div>
            </div>
        </div>
    );
};

export default TimePicker;
