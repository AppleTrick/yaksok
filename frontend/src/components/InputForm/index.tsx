import React from 'react';
import './styles.css';


interface InputFormProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const InputForm: React.FC<InputFormProps> = ({ label, error, ...props }) => {
    return (
        <div className="input-form-container">
            {label && <label className="input-label">{label}</label>}
            <input className={`input-field ${error ? 'input-error' : ''}`} {...props} />
            {error && <span className="error-message">{error}</span>}
        </div>
    );
};

export default InputForm;
