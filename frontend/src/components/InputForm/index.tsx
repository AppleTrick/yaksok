import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './styles.css';

interface InputFormProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

const InputForm: React.FC<InputFormProps> = ({ label, error, ...props }) => {
    return (
        <div className="input-form-container">
            {label && <label className="input-label">{label}</label>}

            <motion.div
                animate={error ? { x: [-2, 2, -2, 2, 0] } : { x: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                <input
                    className={`input-field ${error ? 'input-error' : ''}`}
                    {...props}
                />
            </motion.div>

            <AnimatePresence mode="wait">
                {error && (
                    <motion.span
                        className="error-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {error}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InputForm;
