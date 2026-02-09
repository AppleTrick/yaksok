import React from 'react';
import './styles.css';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    label,
    disabled = false
}) => {
    return (
        <label className={`toggle-switch-container ${disabled ? 'disabled' : ''}`}>
            {label && <span className="toggle-label">{label}</span>}
            <div 
                className={`toggle-track ${checked ? 'checked' : ''}`}
                onClick={() => !disabled && onChange(!checked)}
            >
                <div className="toggle-thumb" />
            </div>
        </label>
    );
};

export default ToggleSwitch;
