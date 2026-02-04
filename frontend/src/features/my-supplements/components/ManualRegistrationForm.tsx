import React, { useState } from 'react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem, MealCategory } from '@/features/notification/types';
import TimePicker from '@/components/TimePicker';
import DaySelector from '@/components/DaySelector';
import { searchSupplements } from '../api/searchApi';
import { updateUserProducts, UserProductUpdateItem, getUserProducts, createUserProduct } from '../api/supplementApi'; // Import new Function
import { createNotification, NotificationCategory } from '@/features/notification/api/notificationApi';
import { MockSupplement } from '../api/mockData';
import { Search, Loader2 } from 'lucide-react';
import '../styles.css';

interface ManualRegistrationFormProps {
    onClose: () => void;
    initialData?: MedicationItem;
}

export default function ManualRegistrationForm({ onClose, initialData }: ManualRegistrationFormProps) {
    const { addMedication } = useScheduleContext();
    const [name, setName] = useState(initialData?.name || '');
    // const [category, setCategory] = useState(initialData?.category || '');
    // const [efficacy, setEfficacy] = useState(initialData?.efficacy || '');
    // const [ingredients, setIngredients] = useState(initialData?.ingredients || '');
    // const [dosage, setDosage] = useState(initialData?.dosage || 1);
    const [time, setTime] = useState('08:00');
    const [mealCategory, setMealCategory] = useState<MealCategory>('post_meal'); // Default
    const [isSaving, setIsSaving] = useState(false); // Add saving state

    // Default to all days for manual entry as requested
    const selectedDays = [0, 1, 2, 3, 4, 5, 6];

    // const [searchQuery, setSearchQuery] = useState(''); // Removed search
    // const [searchResults, setSearchResults] = useState<MockSupplement[]>([]);
    // const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            alert('영양제 이름을 입력해주세요.');
            return;
        }
        if (!mealCategory) {
            alert('복용 시점을 선택해주세요.');
            return;
        }
        if (!time) {
            alert('섭취 시간을 설정해주세요.');
            return;
        }

        setIsSaving(true);

        // 1. Prepare Payload for Creation
        const CATEGORY_MAP: Record<string, 'EMPTY' | 'AFTERMEAL' | 'BEFORESLEEP'> = {
            'empty_stomach': 'EMPTY',
            'post_meal': 'AFTERMEAL',
            'pre_sleep': 'BEFORESLEEP'
        };

        const createPayload = {
            nickname: name.trim(),
            category: CATEGORY_MAP[mealCategory],
            time: time.length === 5 ? `${time}:00` : time // HH:mm:ss format
        };

        console.log("Final Payload:", createPayload); // Debugging log

        console.log("Final Payload:", createPayload); // Debugging log

        try {
            // 2. Call Backend Creation API
            await createUserProduct(createPayload);
            // console.log("Supplement created:", response);

            // 3. Notification Creation (Separate Step)
            // Need ID of created product. Fetch list again to find it.
            try {
                const listResponse = await getUserProducts();
                // Find the newly created item (assuming latest or match by name)
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
                    console.log('✅ 알림 생성 완료:', addedProduct.userProductId);
                } else {
                    console.warn('⚠️ 알림 생성 실패: 방금 등록한 영양제를 조회할 수 없습니다.');
                }
            } catch (notiError) {
                console.error('❌ 알림 생성 실패 (본 등록은 성공):', notiError);
            }

            // 4. Update UI Context Mock if needed
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

        } catch (error: any) { // Type assertion for axios error
            console.error("Failed to save supplement:", error);
            // Safely logging error details
            if (error.response) {
                console.error("Server Error Data:", error.response.data);
                console.error("Server Error Status:", error.response.status);
            }
            const serverMessage = error.response?.data?.message || error.message || "알 수 없는 오류";
            alert(`저장 중 오류가 발생했습니다.\n내용: ${serverMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="manual-form">
            <h3 className="form-title">{initialData ? '영양제 수정' : '영양제 등록'}</h3>

            {/* Name Input */}
            <div className="form-group">
                <label>닉네임 (필수)</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 내 비타민"
                    className="form-input"
                />
            </div>

            {/* Other fields removed: Category, Efficacy, Ingredients, Dosage */}

            {/* Counter removed */}

            <div className="form-group">
                <label>복용 시점</label>
                <div className="meal-category-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {(['empty_stomach', 'post_meal', 'pre_sleep'] as MealCategory[]).map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`meal-cat-btn ${mealCategory === cat ? 'active' : ''}`}
                            onClick={() => setMealCategory(cat)}
                        >
                            {cat === 'empty_stomach' ? '식전' : cat === 'post_meal' ? '식후' : '취침전'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Day Selection Removed from UI - Default All Days in Logic */}

            <div className="form-group">
                <label>섭취 희망 시간</label>
                <div className="time-picker-wrapper">
                    <TimePicker value={time} onChange={setTime} />
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={onClose} disabled={isSaving}>취소</button>
                <button type="submit" className="submit-btn" disabled={!name || isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : (initialData ? '수정 완료' : '등록하기')}
                </button>
            </div>
        </form>
    );
}

