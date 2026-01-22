import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import './styles.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    hideCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    hideCloseButton = false
}) => {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="cm-modal-overlay" onClick={onClose}>
            <div className="cm-modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                {(title || !hideCloseButton) && (
                    <div className="cm-modal-header">
                        <span className="cm-modal-title">{title}</span>
                        {!hideCloseButton && (
                            <button className="cm-close-btn" onClick={onClose}>
                                <X size={24} />
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="cm-modal-body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="cm-modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
