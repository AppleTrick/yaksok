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

    const [selected, setSelected] = useState(parseTime(value || "09:00"));
    const [editingColumn, setEditingColumn] = useState<'hour' | 'minute' | null>(null);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSelected(parseTime(value || "09:00"));
    }, [value]);

    useEffect(() => {
        if (editingColumn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingColumn]);

    // Handle updates
    const updateTime = useCallback((newAmpm: AmPm, newHour: number, newMinute: number) => {
        let h = newHour;
        if (newAmpm === '오후' && h < 12) h += 12;
        if (newAmpm === '오전' && h === 12) h = 0;

        const mStr = newMinute.toString().padStart(2, '0');
        const hStr = h.toString().padStart(2, '0');
        onChange(`${hStr}:${mStr}`);
    }, [onChange]);

    // Input Handlers
    const handleColumnClick = (type: 'hour' | 'minute') => {
        if (disabled) return;
        setEditingColumn(type);
        setInputValue(""); // Clear for fresh typing
    };

    const handleInputBlur = () => {
        if (editingColumn && inputValue) {
            const num = parseInt(inputValue, 10);
            if (!isNaN(num)) {
                if (editingColumn === 'hour') {
                    // Validate hour 1-12
                    let validHour = num;
                    if (num < 1) validHour = 1;
                    if (num > 12) validHour = 12;
                    updateTime(selected.ampm, validHour, selected.minute);
                } else {
                    // Validate minute 0-59
                    let validMinute = num;
                    if (num < 0) validMinute = 0;
                    if (num > 59) validMinute = 59;
                    updateTime(selected.ampm, selected.hour, validMinute);
                }
            }
        }
        setEditingColumn(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
    };

    // simplified scroll simulation logic for UI structure
    const amPmOptions: AmPm[] = ['오전', '오후'];
    const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

    return (
        <div className={`time-picker-wrapper ${disabled ? 'disabled' : ''}`}>
            {label && <div className="time-picker-label">{label}</div>}

            <div className="picker-columns">
                <div className="picker-highlight"></div>

                {/* AM/PM */}
                <div className="picker-column">
                    <div className="picker-spacer"></div>
                    {amPmOptions.map((opt) => (
                        <div
                            key={opt}
                            className={`picker-item ${selected.ampm === opt ? 'selected' : ''}`}
                            onClick={() => !disabled && updateTime(opt, selected.hour, selected.minute)}
                        >
                            {opt}
                        </div>
                    ))}
                    <div className="picker-spacer"></div>
                </div>

                {/* Hour */}
                <div className="picker-column" onClick={() => !editingColumn && handleColumnClick('hour')}>
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
                                placeholder={selected.hour.toString()}
                            />
                        </div>
                    ) : (
                        hourOptions.map((h) => (
                            <div
                                key={h}
                                className={`picker-item ${selected.hour === h ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!disabled) {
                                        if (selected.hour === h) {
                                            handleColumnClick('hour');
                                        } else {
                                            updateTime(selected.ampm, h, selected.minute);
                                        }
                                    }
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
                <div className="picker-column" onClick={() => !editingColumn && handleColumnClick('minute')}>
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
                                placeholder={selected.minute.toString().padStart(2, '0')}
                            />
                        </div>
                    ) : (
                        minuteOptions.map((m) => (
                            <div
                                key={m}
                                className={`picker-item ${selected.minute === m ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!disabled) {
                                        if (selected.minute === m) {
                                            handleColumnClick('minute');
                                        } else {
                                            updateTime(selected.ampm, selected.hour, m);
                                        }
                                    }
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
