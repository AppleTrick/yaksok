import React, { useState, useEffect } from 'react';
import { Pill, Clock, AlertCircle, ChevronRight, BarChart2, Bell } from 'lucide-react';
import { MedicationItem, Cycle, MealCategory } from '@/features/notification/types';
import Modal from '@/components/Modal';
import NutrientProgressBar from './NutrientProgressBar';
import TimePicker from '@/components/TimePicker';
import DaySelector from '@/components/DaySelector';
import ToggleSwitch from '@/components/ToggleSwitch';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import '../styles.css';

interface SupplementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MedicationItem;
    relatedSchedules: { label: string; time: string; cycle: Cycle }[]; // Kept for interface compatibility but we'll fetch fresh data
    onDelete: () => void;
    onToggleStatus: (newStatus: 'taking' | 'stopped') => void;
    onEdit: () => void;
}

import { COLORS } from '@/constants/colors';

const SupplementDetailModal: React.FC<SupplementDetailModalProps> = ({
    isOpen,
    onClose,
    item,
    onDelete,
    onToggleStatus,
    onEdit
}) => {
    const { schedules, updateSchedule, addMedication } = useScheduleContext();

    // State for local editing of schedule
    const [targetScheduleId, setTargetScheduleId] = useState<string | null>(null);
    const [mealCategory, setMealCategory] = useState<MealCategory>('post_meal');
    const [time, setTime] = useState('09:00');
    // Initialize with all days (0-6)
    const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [isExpandedTime, setIsExpandedTime] = useState(false);

    // New State for Edit Mode (Supplement Details)
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState('');
    const [efficacy, setEfficacy] = useState('');
    const [category, setCategory] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [cautions, setCautions] = useState('');

    // Initialize state from context when modal opens or item changes
    useEffect(() => {
        if (isOpen && item) {
            const foundSchedule = schedules.find(s => s.items.some(i => i.id === item.id));
            if (foundSchedule) {
                setTargetScheduleId(foundSchedule.id);
                setMealCategory(foundSchedule.mealCategory || 'post_meal');
                setTime(foundSchedule.rawTime);

                // Set days from item cycle or default to all days
                if (item.cycle && item.cycle.type === 'weekly' && item.cycle.daysOfWeek) {
                    setSelectedDays(item.cycle.daysOfWeek);
                } else {
                    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
                }
            } else {
                setTargetScheduleId(null);
                setTime('09:00');
                setMealCategory('post_meal');
                setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
            }

            // Init details
            setName(item.name);
            setEfficacy(item.efficacy || '');
            setCategory(item.category || '');
            setIngredients(item.ingredients || '');
            setCautions(item.cautions || '');

            setIsEditing(false); // Reset to read-only on open
        }
    }, [isOpen, item, schedules]);

    const handleSaveSchedule = () => {
        // Construct new cycle object
        const newCycle: Cycle = {
            type: 'weekly',
            daysOfWeek: selectedDays
        };

        const updatedItemData: MedicationItem = {
            ...item,
            name: name,
            efficacy: efficacy,
            category: category,
            ingredients: ingredients,
            cautions: cautions,
            cycle: newCycle
        };

        if (!targetScheduleId) {
            addMedication(updatedItemData, time, mealCategory);
        } else {
            const oldSchedule = schedules.find(s => s.id === targetScheduleId);
            if (!oldSchedule) return;

            if (oldSchedule.rawTime !== time || oldSchedule.mealCategory !== mealCategory) {
                // Move logic
                const newItemsForOld = oldSchedule.items.filter(i => i.id !== item.id);
                updateSchedule(oldSchedule.id, oldSchedule.rawTime, oldSchedule.mealCategory, newItemsForOld);

                addMedication(updatedItemData, time, mealCategory);
            } else {
                // In-place update
                const updatedItems = oldSchedule.items.map(i =>
                    i.id === item.id ? updatedItemData : i
                );
                updateSchedule(oldSchedule.id, time, mealCategory, updatedItems);
            }
        }
        setIsEditing(false); // Exit edit mode
        alert("수정사항이 저장되었습니다.");
    };



    const renderFooter = () => {
        if (isEditing) {
            return (
                <div className="modal-actions">
                    <button className="action-btn" onClick={handleSaveSchedule} style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>
                        저장
                    </button>
                    <button className="action-btn" onClick={() => setIsEditing(false)} style={{ backgroundColor: COLORS.mediumGray, color: COLORS.white }}>
                        취소
                    </button>
                    <button className="action-btn delete" onClick={() => {
                        if (confirm("정말 이 영양제를 모든 일정에서 삭제하시겠습니까?")) {
                            onDelete();
                        }
                    }} style={{ backgroundColor: COLORS.error, color: COLORS.white }}>
                        삭제하기
                    </button>
                </div>
            );
        }
        return (
            <div className="modal-actions">
                <button className="action-btn edit" onClick={() => setIsEditing(true)} style={{ backgroundColor: COLORS.primary, color: COLORS.white }}>
                    수정
                </button>
                <button
                    className={`action-btn ${item.status === 'stopped' ? 'resume' : 'stop'}`}
                    onClick={() => onToggleStatus(item.status === 'stopped' ? 'taking' : 'stopped')}
                    style={{
                        backgroundColor: item.status === 'stopped' ? COLORS.success : COLORS.morning,
                        color: 'white'
                    }}
                >
                    {item.status === 'stopped' ? '복용 재개' : '복용 중단'}
                </button>
                <button className="action-btn delete" onClick={() => {
                    if (confirm("정말 이 영양제를 모든 일정에서 삭제하시겠습니까?")) {
                        onDelete();
                    }
                }} style={{ backgroundColor: COLORS.error, color: COLORS.white }}>
                    삭제하기
                </button>
            </div>
        );
    };

    const inputStyle = {
        width: '100%',
        padding: '8px',
        border: `1px solid ${COLORS.lightGray}`,
        borderRadius: '8px',
        fontSize: '0.9rem',
        marginTop: '4px',
        fontFamily: 'inherit'
    };

    const textareaStyle = {
        ...inputStyle,
        minHeight: '80px',
        resize: 'vertical' as const
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} footer={renderFooter()}>
            {/* Hero Section: Icon & Name */}
            <div className="modal-hero">
                <div className="modal-icon-wrapper">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="supplement-img" />
                    ) : (
                        <Pill size={40} color={COLORS.primary} />
                    )}
                </div>
                {isEditing ? (
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="영양제 이름"
                        style={{ ...inputStyle, fontSize: '1.2rem', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}
                    />
                ) : (
                    <h2 className="modal-title">{item.name}</h2>
                )}

                <div className="modal-badges">
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                            <input
                                type="text"
                                value={efficacy}
                                onChange={(e) => setEfficacy(e.target.value)}
                                placeholder="효능 (예: 피로회복)"
                                style={{ ...inputStyle, width: '40%' }}
                            />
                            <input
                                type="text"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="카테고리 (예: 비타민)"
                                style={{ ...inputStyle, width: '40%' }}
                            />
                        </div>
                    ) : (
                        <>
                            {item.efficacy && (
                                <span className="modal-badge efficacy">{item.efficacy}</span>
                            )}
                            {item.category && (
                                <span className="modal-badge category">{item.category}</span>
                            )}
                            {!item.efficacy && !item.category && (
                                <span className="modal-badge" style={{ backgroundColor: COLORS.lightGray, color: COLORS.mediumGray }}>
                                    상세 정보 없음
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 1. Nutrient Analysis Chart (Read-Only for MVP) */}
            <div className="detail-section">
                <div className="section-label">
                    <BarChart2 size={16} />
                    <span>영양소 분석</span>
                </div>
                {/* Only showing this in read-only or always? User didn't ask to edit this specifically. Keeping as is. */}
                <div className="nutrient-chart-container" style={{ padding: '0.5rem 0' }}>
                    {(() => {
                        let mockNutrients = [];
                        // Fallback logic based on name if category edited
                        const searchTarget = category || name;
                        if (searchTarget?.includes('오메가')) {
                            mockNutrients = [
                                { label: 'EPA+DHA', current: 1000, max: 1000, unit: 'mg' },
                                { label: '비타민E', current: 11, max: 11, unit: 'mgTE' }
                            ];
                        } else if (searchTarget?.includes('비타민')) {
                            mockNutrients = [
                                { label: '비타민D', current: 50, max: 10, unit: 'μg' },
                                { label: '비타민C', current: 1000, max: 2000, unit: 'mg' }
                            ];
                        } else {
                            mockNutrients = [
                                { label: '주성분 함량', current: 100, max: 200, unit: 'mg' }
                            ];
                        }
                        return mockNutrients.map((n, i) => (
                            <NutrientProgressBar key={i} label={n.label} current={n.current} max={n.max} unit={n.unit} />
                        ));
                    })()}
                    <div className="analysis-note" style={{ fontSize: '0.8rem', color: COLORS.mediumGray, backgroundColor: COLORS.lightGray, padding: '12px', borderRadius: '8px', marginTop: '8px' }}>
                        <p>💡 <b>알고 계셨나요?</b></p>
                        <p style={{ marginTop: '4px' }}>
                            {name.includes('비타민') ? '비타민D는 지용성이므로 식사 후 섭취하면 흡수율이 높아집니다.' : '현재 섭취 중인 다른 영양제와 성분이 중복되지 않는지 확인하세요.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Ingredients Accordion / Edit Mode */}
            <div className="detail-section">
                {isEditing ? (
                    <div style={{ width: '100%' }}>
                        <div className="section-label" style={{ marginBottom: '4px' }}>
                            <Pill size={16} /><span>성분/함량 정보</span>
                        </div>
                        <textarea
                            value={ingredients}
                            onChange={(e) => setIngredients(e.target.value)}
                            placeholder="성분 및 함량 정보를 입력하세요"
                            style={textareaStyle}
                        />
                    </div>
                ) : (
                    item.ingredients && (
                        <details className="cm-accordion">
                            <summary className="cm-accordion-header">
                                <div className="section-label" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Pill size={16} /><span>성분/함량 정보</span></div>
                                </div>
                                <ChevronRight className="cm-accordion-icon" size={18} />
                            </summary>
                            <div className="cm-accordion-content">{item.ingredients}</div>
                        </details>
                    )
                )}
            </div>

            {/* 3. Detail Information (Caution) / Edit Mode */}
            <div className="detail-section">
                <div className="section-label">
                    <AlertCircle size={16} />
                    <span>섭취 가이드 & 주의사항</span>
                </div>
                {isEditing ? (
                    <textarea
                        value={cautions}
                        onChange={(e) => setCautions(e.target.value)}
                        placeholder="섭취 시 주의사항을 입력하세요"
                        style={textareaStyle}
                    />
                ) : (
                    item.cautions ? (
                        <div className="caution-box">{item.cautions}</div>
                    ) : (
                        <div className="info-card"><p>특별한 주의사항이 등록되지 않았습니다.</p></div>
                    )
                )}
            </div>

            {/* 4. Notification Settings (Edit Mode Logic) */}
            <div className={`detail-section ${isEditing ? 'editing-mode' : ''}`} style={{ borderRadius: '16px' }}>
                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="section-label" style={{ marginBottom: 0 }}>
                        <Clock size={16} />
                        <span>섭취 일정</span>
                    </div>
                </div>

                <div className="notification-settings-container" style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Meal Category */}
                    <div className="setting-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: COLORS.black, marginBottom: '8px', display: 'block' }}>복용 시점</label>
                        <div className="meal-category-selector" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', backgroundColor: isEditing ? COLORS.lightGray : 'transparent', padding: isEditing ? '4px' : '0', borderRadius: '12px' }}>
                            {(['empty_stomach', 'post_meal', 'pre_sleep'] as MealCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => setMealCategory(cat)}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: mealCategory === cat ? (isEditing ? COLORS.white : COLORS.subBackground) : 'transparent',
                                        color: mealCategory === cat ? COLORS.primary : COLORS.mediumGray,
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        boxShadow: isEditing && mealCategory === cat ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                                        transition: 'all 0.2s',
                                        cursor: isEditing ? 'pointer' : 'default'
                                    }}
                                >
                                    {cat === 'empty_stomach' ? '식전(공복)' : cat === 'post_meal' ? '식후' : '취침전'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Day Selection (Moved Above Time) */}
                    <div className="setting-group" style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: COLORS.black, marginBottom: '8px', display: 'block' }}>반복 요일</label>
                        <DaySelector value={selectedDays} onChange={setSelectedDays} disabled={!isEditing} />
                    </div>

                    {/* Time Picker */}
                    <div className="setting-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 600, color: COLORS.black, marginBottom: '8px', display: 'block' }}>시간 설정</label>
                        <div style={{ border: isEditing ? `1px solid ${COLORS.lightGray}` : 'none', borderRadius: '12px', overflow: 'hidden' }}>
                            <div
                                onClick={() => isEditing && setIsExpandedTime(!isExpandedTime)}
                                style={{ padding: isEditing ? '12px 16px' : '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isEditing ? COLORS.white : 'transparent', cursor: isEditing ? 'pointer' : 'default' }}
                            >
                                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: COLORS.black }}>{(() => {
                                    const [h, m] = time.split(':').map(Number);
                                    const ampm = h < 12 ? '오전' : '오후';
                                    const dh = h === 0 ? 12 : h > 12 ? h - 12 : h;
                                    return `${ampm} ${dh}:${m.toString().padStart(2, '0')}`;
                                })()}</span>
                                {isEditing && <ChevronRight size={20} color={COLORS.mediumGray} style={{ transform: isExpandedTime ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />}
                            </div>
                            {isEditing && isExpandedTime && (
                                <div style={{ borderTop: `1px solid ${COLORS.lightGray}`, padding: '16px', backgroundColor: COLORS.lightGray }}>
                                    <TimePicker value={time} onChange={setTime} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default SupplementDetailModal;
