import React, { useState } from 'react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem } from '@/features/notification/types';
import TimePicker from '@/components/TimePicker';
import './styles.css';

interface ManualRegistrationFormProps {
    onClose: () => void;
}

export default function ManualRegistrationForm({ onClose }: ManualRegistrationFormProps) {
    const { addMedication } = useScheduleContext();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [efficacy, setEfficacy] = useState('');
    const [time, setTime] = useState('08:00'); // Default 8:00 AM

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert('영양제 이름을 입력해주세요.');
            return;
        }

        const newItem: MedicationItem = {
            id: Date.now().toString(),
            name: name.trim(),
            category: category.trim() || undefined,
            efficacy: efficacy.trim() || undefined,
            isTaken: false,
            cycle: { type: 'daily' }, // Default daily for MVP
            status: 'taking',
            imageUrl: undefined // Placeholder
        };

        addMedication(newItem, time);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="manual-form">
            <h3 className="form-title">영양제 직접 등록</h3>

            <div className="form-group">
                <label>제품명 (필수)</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예: 종합비타민"
                    className="form-input"
                    autoFocus
                />
            </div>

            <div className="form-group">
                <label>종류/카테고리</label>
                <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="예: 비타민"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>효능/효과</label>
                <input
                    type="text"
                    value={efficacy}
                    onChange={(e) => setEfficacy(e.target.value)}
                    placeholder="예: 피로 회복"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>섭취 시간</label>
                {/* Reusing TimePicker for consistency */}
                <div className="time-picker-wrapper">
                    <TimePicker value={time} onChange={setTime} />
                </div>
            </div>

            <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={onClose}>취소</button>
                <button type="submit" className="submit-btn">등록하기</button>
            </div>
        </form>
    );
}
