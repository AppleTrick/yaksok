import React, { useEffect, useRef, useState, useCallback } from 'react';
import './styles.css';

interface TimePickerProps {
    value: string; // "HH:mm" (24-hour format)
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

type AmPm = '오전' | '오후';

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

    const [parsedTime, setParsedTime] = useState(parseTime(value || "09:00"));
    const [editingColumn, setEditingColumn] = useState<'hour' | 'minute' | null>(null);
    const [inputValue, setInputValue] = useState("");

    // Independent states for visual selection
    const [activeAmpm, setActiveAmpm] = useState<AmPm>(parsedTime.ampm);
    const [activeHour, setActiveHour] = useState<number>(parsedTime.hour);
    const [activeMinute, setActiveMinute] = useState<number>(parsedTime.minute);

    const inputRef = useRef<HTMLInputElement>(null);

    // Column Refs
    const ampmRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minuteRef = useRef<HTMLDivElement>(null);

    // Interaction Flags
    const isProgrammaticScroll = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const ITEM_HEIGHT = 40;

    const amPmOptions: AmPm[] = ['오전', '오후'];
    const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

    // Sync state with prop value
    useEffect(() => {
        const parsed = parseTime(value || "09:00");
        setParsedTime(parsed);
        // Only sync active visuals if we are NOT currently interacting
        if (!isProgrammaticScroll.current) {
            setActiveAmpm(parsed.ampm);
            setActiveHour(parsed.hour);
            setActiveMinute(parsed.minute);
        }
    }, [value]);

    useEffect(() => {
        if (editingColumn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingColumn]);

    // Update parent logic
    const updateTime = useCallback((newAmpm: AmPm, newHour: number, newMinute: number) => {
        let h = newHour;
        if (newAmpm === '오후' && h < 12) h += 12;
        if (newAmpm === '오전' && h === 12) h = 0;

        const mStr = newMinute.toString().padStart(2, '0');
        const hStr = h.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    }, [onChange]);


    // Intersection Observer Logic
    useEffect(() => {
        if (disabled) return;

        const createObserver = (
            root: HTMLDivElement,
            callback: (val: any) => void,
            optionsList: any[]
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
                                callback(parsedVal);
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
            const observer = createObserver(ampmRef.current, (val) => {
                setActiveAmpm(val);
                triggerUpdate(val, activeHour, activeMinute);
            }, amPmOptions);
            Array.from(ampmRef.current.children).forEach(child => {
                if (child.classList.contains('picker-item')) observer.observe(child);
            });
            observers.push(observer);
        }

        if (hourRef.current) {
            const observer = createObserver(hourRef.current, (val) => {
                setActiveHour(val);
                triggerUpdate(activeAmpm, val, activeMinute);
            }, hourOptions);
            Array.from(hourRef.current.children).forEach(child => {
                if (child.classList.contains('picker-item')) observer.observe(child);
            });
            observers.push(observer);
        }

        if (minuteRef.current) {
            const observer = createObserver(minuteRef.current, (val) => {
                setActiveMinute(val);
                triggerUpdate(activeAmpm, activeHour, val);
            }, minuteOptions);
            Array.from(minuteRef.current.children).forEach(child => {
                if (child.classList.contains('picker-item')) observer.observe(child);
            });
            observers.push(observer);
        }

        return () => {
            observers.forEach(obs => obs.disconnect());
        };
    }, []);

    // Active state ref to avoid closure issues in triggerUpdate
    const activeStateRef = useRef({ ampm: parsedTime.ampm, hour: parsedTime.hour, minute: parsedTime.minute });
    useEffect(() => {
        activeStateRef.current = { ampm: activeAmpm, hour: activeHour, minute: activeMinute };
    }, [activeAmpm, activeHour, activeMinute]);

    const triggerUpdate = (navAmpm: AmPm, navHour: number, navMinute: number) => {
        // While programmatic scrolling, we might still receive intersection events.
        // We can choose to update the parent immediately or debounce.
        // If we are clicking, we probably want to update the parent at the END of the scroll?
        // Or continuously is fine too, as long as visual jump doesn't happen.

        activeStateRef.current = { ampm: navAmpm, hour: navHour, minute: navMinute };

        if (timerRef.current) clearTimeout(timerRef.current);

        // Debounce update to parent
        timerRef.current = setTimeout(() => {
            if (isProgrammaticScroll.current) return; // Wait until scroll ends if programmatic? 
            // Actually better to update so UI is consistent.

            const current = activeStateRef.current;
            updateTime(current.ampm, current.hour, current.minute);
        }, 150);
    };


    // Initial Scroll Position
    useEffect(() => {
        // Scroll to initial position without animation
        const initScroll = (ref: React.RefObject<HTMLDivElement>, list: any[], val: any) => {
            if (ref.current) {
                const idx = list.indexOf(val);
                if (idx >= 0) ref.current.scrollTop = idx * ITEM_HEIGHT;
            }
        };
        initScroll(ampmRef, amPmOptions, parsedTime.ampm);
        initScroll(hourRef, hourOptions, parsedTime.hour);
        initScroll(minuteRef, minuteOptions, parsedTime.minute);
    }, []);


    // --- Click & Scroll Logic ---

    const handleItemClick = (
        ref: React.RefObject<HTMLDivElement>,
        value: any,
        list: any[],
        type: 'ampm' | 'hour' | 'minute'
    ) => {
        if (disabled || !ref.current) return;

        // Prevent double activation if already scrolling heavily
        // But we want to ALLOW clicking to interrupt/redirect scroll.

        const idx = list.indexOf(value);
        if (idx === -1) return;

        isProgrammaticScroll.current = true; // Set flag to control side effects

        // 1. Temporarily disable snap to prevent "fighting"
        ref.current.style.scrollSnapType = 'none';

        // 2. Smooth scroll to target
        ref.current.scrollTo({
            top: idx * ITEM_HEIGHT,
            behavior: 'smooth'
        });

        // 3. Immediately update active state visually (responsiveness)
        if (type === 'ampm') setActiveAmpm(value);
        else if (type === 'hour') setActiveHour(value);
        else setActiveMinute(value);

        // 4. Update Parent Logic
        if (type === 'ampm') updateTime(value, activeHour, activeMinute);
        else if (type === 'hour') updateTime(activeAmpm, value, activeMinute);
        else updateTime(activeAmpm, activeHour, value);

        // 5. Re-enable Snap after scroll finishes
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
            if (ref.current) {
                ref.current.style.scrollSnapType = 'y mandatory';
                isProgrammaticScroll.current = false;
            }
        }, 500); // Standard smooth scroll duration is usually < 500ms
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
                if (editingColumn === 'hour') {
                    let validHour = Math.max(1, Math.min(12, num));
                    updateTime(activeAmpm, validHour, activeMinute);
                    setActiveHour(validHour);
                    const idx = hourOptions.indexOf(validHour);
                    if (hourRef.current) hourRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
                } else {
                    let validMinute = Math.max(0, Math.min(59, num));
                    updateTime(activeAmpm, activeHour, validMinute);
                    setActiveMinute(validMinute);
                    const idx = minuteOptions.indexOf(validMinute);
                    if (minuteRef.current) minuteRef.current.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
                }
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
                    {amPmOptions.map((opt) => (
                        <div
                            key={opt}
                            className={`picker-item ${activeAmpm === opt ? 'selected' : ''}`}
                            data-value={opt}
                            onClick={() => handleItemClick(ampmRef, opt, amPmOptions, 'ampm')}
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
                        hourOptions.map((h) => (
                            <div
                                key={h}
                                className={`picker-item ${activeHour === h ? 'selected' : ''}`}
                                data-value={h}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(hourRef, h, hourOptions, 'hour');
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
                        minuteOptions.map((m) => (
                            <div
                                key={m}
                                className={`picker-item ${activeMinute === m ? 'selected' : ''}`}
                                data-value={m}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleItemClick(minuteRef, m, minuteOptions, 'minute');
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
