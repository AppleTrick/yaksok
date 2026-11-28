import React, { useState, useEffect } from 'react';
import { Pill, Coffee, Moon, Sun, Trash2 } from 'lucide-react';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TimeInput, type ISOTimeString } from '@astryxdesign/core/TimeInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { MedicationItem, Cycle, MealCategory } from '@/features/notification/types';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';

interface SupplementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MedicationItem;
    relatedSchedules: { label: string; time: string; cycle: Cycle }[];
    onDelete: () => void;
    onToggleStatus: (newStatus: 'taking' | 'stopped') => void;
    onEdit: () => void;
    onSave?: () => void;
}

const SupplementDetailModal: React.FC<SupplementDetailModalProps> = ({
    isOpen,
    onClose,
    item,
    onDelete,
    onToggleStatus,
    onSave
}) => {
    const { schedules, updateSchedule, addMedication } = useScheduleContext();

    const [mealCategory, setMealCategory] = useState<MealCategory>('post_meal');
    const [time, setTime] = useState('09:00');
    const [selectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [cautions, setCautions] = useState('');
    const [targetScheduleId, setTargetScheduleId] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (isOpen && item) {
            const foundSchedule = schedules.find(s => s.items.some(i => i.id === item.id));
            if (foundSchedule) {
                setTargetScheduleId(foundSchedule.id);
                setMealCategory(foundSchedule.mealCategory || 'post_meal');
                setTime(foundSchedule.rawTime);
            }
            setName(item.nickname || item.productName || '');
            setIngredients(item.ingredients || '');
            setCautions(item.cautions || '');
            setIsEditing(false);
            setShowDeleteConfirm(false);
        }
    }, [isOpen, item, schedules]);

    const handleSave = () => {
        const newCycle: Cycle = { type: 'weekly', daysOfWeek: selectedDays };
        const updatedItem: MedicationItem = { ...item, nickname: name, ingredients, cautions, cycle: newCycle };

        if (!targetScheduleId) {
            addMedication(updatedItem, time, mealCategory);
        } else {
            const oldSchedule = schedules.find(s => s.id === targetScheduleId);
            if (oldSchedule) {
                if (oldSchedule.rawTime !== time || oldSchedule.mealCategory !== mealCategory) {
                    const newItemsForOld = oldSchedule.items.filter(i => i.id !== item.id);
                    updateSchedule(oldSchedule.id, oldSchedule.rawTime, oldSchedule.mealCategory, newItemsForOld);
                    addMedication(updatedItem, time, mealCategory);
                } else {
                    const updatedItems = oldSchedule.items.map(i => i.id === item.id ? updatedItem : i);
                    updateSchedule(oldSchedule.id, time, mealCategory, updatedItems);
                }
            }
        }
        setIsEditing(false);
        onSave?.() || onClose();
    };


    const mealOptions: { id: MealCategory; label: string; icon: typeof Sun }[] = [
        { id: 'empty_stomach', label: '식전', icon: Coffee },
        { id: 'post_meal', label: '식후', icon: Sun },
        { id: 'pre_sleep', label: '취침전', icon: Moon },
    ];
    const stopped = item.status === 'stopped';

    // Astryx Dialog. 보기 모드에서는 칸을 잠그고, 수정하기를 누르면 연다
    return (
        <>
            <Dialog isOpen={isOpen} onOpenChange={(open) => !open && onClose()} width="min(440px, 100%)" purpose={isEditing ? 'form' : 'info'}>
                <DialogHeader
                    title={isEditing ? '영양제 수정' : (name || '이름 없음')}
                    startContent={<Pill size={22} color="var(--color-icon-accent)" aria-hidden="true" />}
                    onOpenChange={(open) => !open && onClose()}
                />
                <VStack gap={4} padding={4}>
                    {isEditing && <TextInput label="이름" value={name} onChange={setName} placeholder="영양제 이름을 입력하세요" size="lg" />}
                    <Text type="label" weight="semibold">섭취 일정</Text>
                    <SegmentedControl label="먹는 때" layout="fill" isDisabled={!isEditing} value={mealCategory} onChange={(v) => setMealCategory(v as MealCategory)}>
                        {mealOptions.map((o) => <SegmentedControlItem key={o.id} value={o.id} label={o.label} icon={<o.icon size={16} />} />)}
                    </SegmentedControl>
                    <TimeInput label="복용 시간" isDisabled={!isEditing} value={time as ISOTimeString} onChange={(v) => v && setTime(v.slice(0, 5))} />
                    <Divider />
                    <HStack gap={2} wrap="wrap">
                        {isEditing ? (
                            <>
                                <Button variant="primary" label="저장하기" onClick={handleSave} />
                                <Button label="취소" onClick={() => setIsEditing(false)} />
                            </>
                        ) : (
                            <>
                                <Button variant="primary" label="수정하기" onClick={() => setIsEditing(true)} />
                                <Button label={stopped ? '복용 재개' : '복용 중단'} onClick={() => onToggleStatus(stopped ? 'taking' : 'stopped')} />
                            </>
                        )}
                        <Button variant="ghost" icon={<Trash2 size={16} />} label="삭제" onClick={() => setShowDeleteConfirm(true)} />
                    </HStack>
                </VStack>
            </Dialog>
            <AlertDialog isOpen={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="영양제를 삭제할까요?"
                description="알림도 같이 지워지고 되돌릴 수 없어요." actionLabel="삭제" cancelLabel="취소" onAction={onDelete} />
        </>
    );
};

export default SupplementDetailModal;
