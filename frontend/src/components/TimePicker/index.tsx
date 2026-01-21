import React from 'react';
import './styles.css';

interface TimePickerProps {
    value: string; // "HH:mm" format
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}

const TimePicker: React.FC<TimePickerProps> = ({
    value,
    onChange,
    label,
    disabled = false
}) => {
    return (
        <label className={`time-picker-container ${disabled ? 'disabled' : ''}`}>
            {label && <span className="time-label">{label}</span>}
            <div className="time-input-wrapper">
                <input
                    type="time"
                    className="time-input"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                />
            </div>
        </label>
    );
};

export default TimePicker;
