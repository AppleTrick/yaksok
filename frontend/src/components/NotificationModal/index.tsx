import React, { useState } from 'react';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { Schedule } from '@/features/notification/contexts/ScheduleContext';
import './styles.css';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    schedule: Schedule;
    eventId: number;
    onConfirm: (scheduleId: string, itemId: string, supplementId: number) => Promise<{ success: boolean }>;
    onSnooze: (eventId: number) => Promise<{ success: boolean }>;
}

export default function NotificationModal({
    isOpen,
    onClose,
    schedule,
    eventId,
    onConfirm,
    onSnooze
}: NotificationModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirmClick = async () => {
        setIsProcessing(true);

        // 모든 약에 대해 복용 체크
        for (const item of schedule.items) {
            if (!item.isTaken) {
                // supplementId가 없으면 임시로 0 사용 (실제로는 MedicationItem에 supplementId 필드 추가 필요)
                await onConfirm(schedule.id, item.id, (item as any).supplementId || 0);
            }
        }

        setIsProcessing(false);
        onClose();
    };

    const handleSnoozeClick = async () => {
        setIsProcessing(true);
        await onSnooze(eventId);
        setIsProcessing(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="notification-modal-content">
                <h2 className="notification-title">복용 시간 알림</h2>
                <p className="notification-time">{schedule.time}</p>

                <div className="medication-list">
                    <h3>복용할 영양제</h3>
                    <ul>
                        {schedule.items.map(item => (
                            <li key={item.id} className="medication-item">
                                <span className="medication-name">{item.name}</span>
                                {item.dosage && <span className="medication-dosage">{item.dosage}정</span>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="notification-modal-footer">
                <Button
                    variant="secondary"
                    onClick={handleSnoozeClick}
                    disabled={isProcessing}
                >
                    5분 뒤 재알림
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirmClick}
                    disabled={isProcessing}
                    isLoading={isProcessing}
                >
                    복용 완료
                </Button>
            </div>
        </Modal>
    );
}
