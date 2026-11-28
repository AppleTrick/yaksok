import React, { useState } from 'react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { List, ListItem } from '@astryxdesign/core/List';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Schedule } from '@/features/notification/contexts/ScheduleContext';

interface NotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    schedule: Schedule;
    eventId: number;
    onConfirm: (scheduleId: string, itemId: string, supplementId: number) => Promise<{ success: boolean }>;
    onSnooze: (eventId: number) => Promise<{ success: boolean }>;
}

// 복용 시간에 앱 안에서 뜨는 알림 (Astryx Dialog)
export default function NotificationModal({ isOpen, onClose, schedule, eventId, onConfirm, onSnooze }: NotificationModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirmClick = async () => {
        setIsProcessing(true);
        for (const item of schedule.items) {
            // item.id에 supplementId가 들어 있다 (ScheduleContext에서 변환)
            if (!item.isTaken) await onConfirm(schedule.id, item.id, Number(item.id));
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
        <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width="min(400px, 100%)">
            <DialogHeader title="복용 시간이에요" subtitle={schedule.time} onOpenChange={(open) => !open && onClose()} />
            <VStack gap={4} padding={4}>
                <Text type="label" weight="semibold">복용할 영양제</Text>
                <List hasDividers>
                    {schedule.items.map((item) => (
                        <ListItem key={item.id} label={item.name} endContent={item.dosage ? <Badge label={`${item.dosage}정`} /> : undefined} />
                    ))}
                </List>
                <HStack gap={2}>
                    {/* 서버는 10분 뒤에 다시 알린다 (Notification.REMIND_INTERVAL) */}
                    <Button width="100%" label="10분 뒤 다시 알림" onClick={handleSnoozeClick} isDisabled={isProcessing} />
                    <Button width="100%" variant="primary" label="먹었어요" onClick={handleConfirmClick} isLoading={isProcessing} />
                </HStack>
            </VStack>
        </Dialog>
    );
}
