import React, { useState } from 'react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem, MealCategory } from '@/features/notification/types';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { TextInput } from '@astryxdesign/core/TextInput';
import { TimeInput, type ISOTimeString } from '@astryxdesign/core/TimeInput';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Button } from '@astryxdesign/core/Button';
import { createUserProduct, getUserProducts } from '../api/supplementApi';
import { createNotification, NotificationCategory } from '@/features/notification/api/notificationApi';
import { Pill, Clock, CheckCircle2 } from 'lucide-react';

interface ManualRegistrationFormProps {
    onClose: () => void;
    initialData?: MedicationItem;
}

const CATEGORY_MAP: Record<string, 'BEFOREMEAL' | 'AFTERMEAL' | 'BEFORESLEEP'> = {
    'empty_stomach': 'BEFOREMEAL',
    'post_meal': 'AFTERMEAL',
    'pre_sleep': 'BEFORESLEEP'
};


const MEAL_LABELS: Record<MealCategory, { label: string; icon: React.ReactNode }> = {
    'empty_stomach': { label: '식전', icon: <Pill size={16} /> },
    'post_meal': { label: '식후', icon: <CheckCircle2 size={16} /> },
    'pre_sleep': { label: '취침전', icon: <Clock size={16} /> }
};

export default function ManualRegistrationForm({ onClose, initialData }: ManualRegistrationFormProps) {
    const { addMedication } = useScheduleContext();
    const [name, setName] = useState(initialData?.name || '');
    const [time, setTime] = useState('08:00');
    const [mealCategory, setMealCategory] = useState<MealCategory>('post_meal');
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('영양제 이름을 입력해주세요.');
            return;
        }

        setIsSaving(true);

        const createPayload = {
            nickname: name.trim(),
            category: CATEGORY_MAP[mealCategory],
            time: time.length === 5 ? `${time}:00` : time
        };

        try {
            await createUserProduct(createPayload);

            try {
                const listResponse = await getUserProducts();
                const addedProduct = listResponse.data.products.find(p => p.nickname === createPayload.nickname);

                if (addedProduct) {
                    let notiCategory: NotificationCategory = 'AFTERMEAL';
                    if (mealCategory === 'empty_stomach') notiCategory = 'BEFOREMEAL';
                    else if (mealCategory === 'pre_sleep') notiCategory = 'BEFORESLEEP';


                    await createNotification({
                        userProductId: addedProduct.userProductId,
                        intakeTime: time,
                        category: notiCategory
                    });
                }
            } catch (notiError) {
                console.error('❌ 알림 생성 실패:', notiError);
            }

            const newItem: MedicationItem = {
                id: Date.now().toString(),
                name: name.trim(),
                dosage: 1,
                isTaken: false,
                cycle: { type: 'weekly', daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
                status: 'taking'
            };
            addMedication(newItem, time, mealCategory);

            alert("영양제가 등록되었습니다.");
            onClose();

        } catch (error: any) {
            const serverMessage = error.response?.data?.message || error.message || "알 수 없는 오류";
            alert(`저장 중 오류가 발생했습니다.\n내용: ${serverMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <VStack gap={4}>
                <TextInput label="영양제 이름" placeholder="예: 내 비타민" value={name} onChange={setName} size="lg" />
                <SegmentedControl label="복용 시점" layout="fill" value={mealCategory} onChange={(v) => setMealCategory(v as MealCategory)}>
                    {(['empty_stomach', 'post_meal', 'pre_sleep'] as MealCategory[]).map((cat) => (
                        <SegmentedControlItem key={cat} value={cat} label={MEAL_LABELS[cat].label} icon={MEAL_LABELS[cat].icon} />
                    ))}
                </SegmentedControl>
                <TimeInput label="섭취 시간" value={time as ISOTimeString} onChange={(v) => v && setTime(v.slice(0, 5))} />
                <HStack gap={2} hAlign="end">
                    <Button label="취소" onClick={onClose} isDisabled={isSaving} />
                    <Button type="submit" variant="primary" label={initialData ? '수정 완료' : '등록하기'} isDisabled={!name} isLoading={isSaving} />
                </HStack>
            </VStack>
        </form>
    );
}
