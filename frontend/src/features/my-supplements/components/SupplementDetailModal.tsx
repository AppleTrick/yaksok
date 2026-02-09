import React, { useState, useEffect } from 'react';
import { Pill, Clock, AlertCircle, ChevronRight, BarChart2, Coffee, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MedicationItem, Cycle, MealCategory } from '@/features/notification/types';
import Modal from '@/components/Modal';
import NutrientProgress from './NutrientProgress';
import TimePicker from '@/components/TimePicker';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { updateNotification, NotificationEditRequest } from '@/features/notification/api/notificationApi';
import { COLORS } from '@/constants/colors';
import '../styles.css';

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

// 헬퍼 함수: 프론트 mealCategory → 백엔드 category 변환
function getBackendCategory(mealCategory: MealCategory): 'EMPTY' | 'AFTERMEAL' | 'BEFORESLEEP' {
    switch (mealCategory) {
        case 'empty_stomach': return 'EMPTY';
        case 'post_meal': return 'AFTERMEAL';
        case 'pre_sleep': return 'BEFORESLEEP';
        default: return 'AFTERMEAL';
    }
}

const SupplementDetailModal: React.FC<SupplementDetailModalProps> = ({
    isOpen,
    onClose,
    item,
    onDelete,
    onToggleStatus,
    onSave
}) => {
    const { schedules, updateSchedule, addMedication, refreshSchedules } = useScheduleContext();

    const [mealCategory, setMealCategory] = useState<MealCategory>('post_meal');
    const [time, setTime] = useState('09:00');
    const [selectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
    const [isExpandedTime, setIsExpandedTime] = useState(false);

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
            setIsExpandedTime(false);
            setShowDeleteConfirm(false);
        }
    }, [isOpen, item, schedules]);

    const handleSave = async () => {
        try {
            const newCycle: Cycle = { type: 'weekly', daysOfWeek: selectedDays };
            const updatedItem: MedicationItem = {
                ...item,
                nickname: name,
                ingredients,
                cautions,
                cycle: newCycle
            };

            // 백엔드 API 호출 추가
            if (targetScheduleId) {
                const oldSchedule = schedules.find(s => s.id === targetScheduleId);
                if (oldSchedule) {
                    // 백엔드 알림 수정 API 호출
                    const apiData: NotificationEditRequest = {
                        notificationId: Number(item.id),
                        userProductId: Number(item.id),
                        intakeTime: time, // "14:00"
                        category: getBackendCategory(mealCategory)
                    };

                    console.log('🔄 백엔드 알림 수정 요청:', apiData);
                    await updateNotification(apiData);
                    console.log('✅ 백엔드 알림 수정 완료');

                    // 백엔드 업데이트 성공 후 최신 데이터 다시 가져오기
                    await refreshSchedules();
                }
            } else {
                addMedication(updatedItem, time, mealCategory);
            }

            setIsEditing(false);
            onSave?.() || onClose();

        } catch (error) {
            console.error('❌ 백엔드 알림 수정 실패:', error);
            alert('알림 수정에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const parseIngredients = (text: string) => {
        if (!text) return [];
        const regex = /([가-힣a-zA-Z\s]+?)\s*(\d+(?:\.\d+)?)\s*([a-zA-Zμµg]+)/g;
        const matches = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            matches.push({ name: match[1].trim(), current: parseFloat(match[2]), unit: match[3], max: 1000 }); // Default max for visual
        }
        return matches.slice(0, 3);
    };

    const renderFooter = () => (
        <div className="modal-actions">
            {isEditing ? (
                <>
                    <button className="action-btn edit" onClick={handleSave}>저장하기</button>
                    <button className="action-btn" onClick={() => setIsEditing(false)}>취소</button>
                </>
            ) : (
                <>
                    <button className="action-btn edit" onClick={() => setIsEditing(true)}>수정하기</button>
                    <button
                        className={`action-btn ${item.status === 'stopped' ? 'resume' : 'stop'}`}
                        onClick={() => onToggleStatus(item.status === 'stopped' ? 'taking' : 'stopped')}
                    >
                        {item.status === 'stopped' ? '복용 재개' : '복용 중단'}
                    </button>
                </>
            )}
            <button className="action-btn delete" onClick={() => setShowDeleteConfirm(true)}>삭제</button>
        </div>
    );

    const mealOptions: { id: MealCategory; label: string; icon: any }[] = [
        { id: 'empty_stomach', label: '식전', icon: Coffee },
        { id: 'post_meal', label: '식후', icon: Sun },
        { id: 'pre_sleep', label: '취침전', icon: Moon },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} footer={renderFooter()}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="modal-internal-container"
            >
                <div className="modal-hero">
                    <div className="modal-icon-wrapper">
                        {item.imageUrl ? <img src={item.imageUrl} alt={name} className="supplement-img" /> : <Pill size={48} color="var(--color-brand)" />}
                    </div>
                    {isEditing ? (
                        <div style={{ width: '100%', maxWidth: '280px' }}>
                            <input
                                className="modern-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="영양제 이름을 입력하세요"
                                style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, padding: '0.75rem' }}
                            />
                        </div>
                    ) : (
                        <h2 className="modal-title">{name || '이름 없음'}</h2>
                    )}
                </div>

                {/* <div className="detail-section">
                    <div className="section-label"><BarChart2 size={16} /><span>핵심 성분 분석</span></div>
                    <div className="nutrient-analysis-list">
                        {parseIngredients(ingredients).map((ing, idx) => (
                            <NutrientProgress key={idx} label={ing.name} current={ing.current} max={ing.max} unit={ing.unit} />
                        ))}
                        {parseIngredients(ingredients).length === 0 && (
                            <div className="info-card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                등록된 성분 정보가 없습니다.
                            </div>
                        )}
                    </div>
                </div> */}

                <div className="detail-section">
                    <div className="section-label"><Clock size={16} /><span>섭취 일정 설정</span></div>
                    <div className="notification-settings-v2">
                        <div className="form-group-v2">
                            <div className="segmented-control-v2">
                                {mealOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        className={`segment-btn ${mealCategory === opt.id ? 'active' : ''}`}
                                        onClick={() => isEditing && setMealCategory(opt.id)}
                                        disabled={!isEditing}
                                    >
                                        <opt.icon size={18} className="btn-icon" />
                                        <span className="btn-text">{opt.label}</span>
                                        {mealCategory === opt.id && (
                                            <motion.div
                                                layoutId="modal-meal-bg"
                                                className="segment-active-bg"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group-v2" style={{ marginTop: '1rem' }}>
                            <motion.div
                                className="modern-time-picker-card"
                                onClick={() => isEditing && setIsExpandedTime(!isExpandedTime)}
                                whileTap={isEditing ? { scale: 0.98 } : {}}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Clock size={18} color="var(--color-brand)" opacity={0.8} />
                                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                                            {(() => {
                                                const [h, m] = time.split(':').map(Number);
                                                return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m.toString().padStart(2, '0')}`;
                                            })()}
                                        </span>
                                    </div>
                                    {isEditing && (
                                        <motion.div
                                            animate={{ rotate: isExpandedTime ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <ChevronRight size={20} color="var(--text-muted)" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                            <AnimatePresence>
                                {isEditing && isExpandedTime && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '1.5rem 0', background: 'var(--bg-base)', borderRadius: '24px', marginTop: '0.5rem' }}>
                                            <TimePicker value={time} onChange={setTime} />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* <div className="detail-section">
                    <div className="section-label"><AlertCircle size={16} /><span>주의사항 안내</span></div>
                    {isEditing ? (
                        <textarea
                            className="modern-input"
                            value={cautions}
                            onChange={(e) => setCautions(e.target.value)}
                            placeholder="섭취 시 주의사항을 입력하세요"
                            style={{ minHeight: '120px', lineHeight: '1.6', fontSize: '0.95rem' }}
                        />
                    ) : (
                        <div className="caution-box">
                            {cautions || '별도의 주의사항 정보가 없습니다.'}
                        </div>
                    )}
                </div> */}
            </motion.div>

            {/* 삭제 확인 커스텀 모달 */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                type="confirm"
                title="영양제 삭제"
                confirmText="삭제하기"
                cancelText="취소"
                onConfirm={onDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            >
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        정말 이 영양제를 삭제하시겠습니까?
                    </p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        삭제된 정보는 복구할 수 없습니다.
                    </p>
                </div>
            </Modal>
        </Modal>
    );
};

export default SupplementDetailModal;
