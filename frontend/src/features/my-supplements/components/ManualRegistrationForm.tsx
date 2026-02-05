import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem, MealCategory } from '@/features/notification/types';
import TimePicker from '@/components/TimePicker';
import { createUserProduct, getUserProducts } from '../api/supplementApi';
import { createNotification, NotificationCategory } from '@/features/notification/api/notificationApi';
import { Loader2, Pill, Clock, LayoutGrid, CheckCircle2 } from 'lucide-react';
import '../styles.css';

interface ManualRegistrationFormProps {
    onClose: () => void;
    initialData?: MedicationItem;
}

const CATEGORY_MAP: Record<string, 'EMPTY' | 'AFTERMEAL' | 'BEFORESLEEP'> = {
    'empty_stomach': 'EMPTY',
    'post_meal': 'AFTERMEAL',
    'pre_sleep': 'BEFORESLEEP'
};

const MEAL_LABELS: Record<MealCategory, { label: string; icon: React.ReactNode }> = {
    'empty_stomach': { label: '식전', icon: <Pill size={18} /> },
    'post_meal': { label: '식후', icon: <CheckCircle2 size={18} /> },
    'pre_sleep': { label: '취침전', icon: <Clock size={18} /> }
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
                    if (mealCategory === 'empty_stomach') notiCategory = 'EMPTY';
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

    const containerVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            className="manual-registration-v2"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Name Input Group */}
            <motion.div className="form-group-v2" variants={itemVariants}>
                <div className="label-with-icon">
                    <LayoutGrid size={16} className="label-icon" />
                    <label>영양제 이름</label>
                </div>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 내 비타민"
                    className="modern-input"
                    autoFocus
                />
            </motion.div>

            {/* Meal Category Group */}
            <motion.div className="form-group-v2" variants={itemVariants}>
                <div className="label-with-icon">
                    <Pill size={16} className="label-icon" />
                    <label>복용 시점</label>
                </div>
                <div className="segmented-control-v2">
                    {(['empty_stomach', 'post_meal', 'pre_sleep'] as MealCategory[]).map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`segment-btn ${mealCategory === cat ? 'active' : ''}`}
                            onClick={() => setMealCategory(cat)}
                        >
                            {mealCategory === cat && (
                                <motion.div
                                    layoutId="segment-bg"
                                    className="segment-active-bg"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                                />
                            )}
                            <span className="btn-icon">{MEAL_LABELS[cat].icon}</span>
                            <span className="btn-text">{MEAL_LABELS[cat].label}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Time Picker Group */}
            <motion.div className="form-group-v2" variants={itemVariants}>
                <div className="label-with-icon">
                    <Clock size={16} className="label-icon" />
                    <label>섭취 시간</label>
                </div>
                <div className="modern-time-picker-card">
                    <TimePicker value={time} onChange={setTime} />
                </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div className="form-actions-v2" variants={itemVariants}>
                <button type="button" className="modern-btn-secondary" onClick={onClose} disabled={isSaving}>
                    취소
                </button>
                <button type="submit" className="modern-btn-primary" disabled={!name || isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (initialData ? '수정 완료' : '등록하기')}
                </button>
            </motion.div>
        </motion.form>
    );
}

