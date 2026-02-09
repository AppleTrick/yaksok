import React, { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/Button';
import './styles.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    footer?: ReactNode;
    hideCloseButton?: boolean;
    // New props for alert/confirm types
    type?: 'default' | 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    hideCloseButton = false,
    type = 'default',
    onConfirm,
    onCancel,
    confirmText = '확인',
    cancelText = '취소'
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

    // Type-based footer rendering
    const renderDefaultFooter = () => {
        if (type === 'alert') {
            return (
                <Button variant="primary" onClick={onConfirm || onClose} style={{ width: '100%' }}>
                    {confirmText}
                </Button>
            );
        }
        if (type === 'confirm') {
            return (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                    <Button variant="secondary" onClick={onCancel || onClose} style={{ flex: 1 }}>
                        {cancelText}
                    </Button>
                    <Button variant="primary" onClick={onConfirm} style={{ flex: 1 }}>
                        {confirmText}
                    </Button>
                </div>
            );
        }
        return footer;
    };

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
                {(footer || type !== 'default') && (
                    <div className="cm-modal-footer">
                        {renderDefaultFooter()}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
