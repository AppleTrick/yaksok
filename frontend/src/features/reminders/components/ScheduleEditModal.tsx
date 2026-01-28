"use client";

import React, { useState, useEffect } from 'react';
import TimePicker from '@/components/TimePicker';
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { MedicationItem, Cycle, MealCategory } from '@/features/notification/types';
import CycleSelector from './CycleSelector';
import './modal.css';

interface ScheduleEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTime: string; // "14:00" (24h format for picker logic)
    initialItems: MedicationItem[];
    initialMealCategory: MealCategory;
    onSave: (time: string, mealCategory: MealCategory, items: MedicationItem[]) => void;
}

export default function ScheduleEditModal({ isOpen, onClose, initialTime, initialItems, initialMealCategory, onSave }: ScheduleEditModalProps) {
    const [time, setTime] = useState(initialTime);
    const [items, setItems] = useState<MedicationItem[]>(initialItems);
    const [mealCategory, setMealCategory] = useState<MealCategory>(initialMealCategory);

    // Adding state
    const [newItemName, setNewItemName] = useState("");
    const [newItemCycle, setNewItemCycle] = useState<Cycle>({ type: 'daily' });
    const [isAdding, setIsAdding] = useState(false);

    // Editing state
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTime(initialTime);
            setItems(initialItems);
            setMealCategory(initialMealCategory);
            setNewItemName("");
            setNewItemCycle({ type: 'daily' });
            setIsAdding(false);
            setExpandedItemId(null);
        }
    }, [isOpen, initialTime, initialItems, initialMealCategory]);

    if (!isOpen) return null;

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAddItem = () => {
        if (!newItemName.trim()) return;
        const newItem: MedicationItem = {
            id: Date.now().toString(),
            name: newItemName.trim(),
            isTaken: false,
            cycle: newItemCycle
        };
        setItems(prev => [...prev, newItem]);
        setNewItemName("");
        setNewItemCycle({ type: 'daily' });
        setIsAdding(false);
    };

    const handleUpdateItemCycle = (id: string, newCycle: Cycle) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, cycle: newCycle } : item
        ));
    };

    const handleSave = () => {
        onSave(time, mealCategory, items);
        onClose();
    };

    const getCycleLabel = (cycle: Cycle) => {
        if (cycle.type === 'daily') return '매일';
        if (cycle.type === 'weekly') {
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return cycle.daysOfWeek?.map(d => days[d]).join(', ') || '요일 미지정';
        }
        if (cycle.type === 'interval') return `${cycle.interval}일 간격`;
        return '';
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content full-sheet">
                <div className="modal-header">
                    <h2>알림 설정</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Meal Category Selection */}
                    <section className="modal-section">
                        <h3 className="section-label">복용 시점</h3>
                        <div className="meal-category-selector">
                            {(['empty_stomach', 'post_meal', 'pre_sleep'] as MealCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    className={`category-btn ${mealCategory === cat ? 'active' : ''}`}
                                    onClick={() => setMealCategory(cat)}
                                >
                                    {cat === 'empty_stomach' && '공복 (식전)'}
                                    {cat === 'post_meal' && '식후'}
                                    {cat === 'pre_sleep' && '취침 전'}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 1. Time Picker Section */}
                    <section className="modal-section">
                        <h3 className="section-label">시간 설정</h3>
                        <div className="time-picker-container">
                            <TimePicker
                                value={time}
                                onChange={setTime}
                            />
                        </div>
                    </section>

                    {/* 2. Supplement List Section */}
                    <section className="modal-section">
                        <div className="section-header">
                            <h3 className="section-label">영양제 목록</h3>
                            {!isAdding && (
                                <button className="add-btn-small" onClick={() => setIsAdding(true)}>
                                    <Plus size={16} /> 추가
                                </button>
                            )}
                        </div>

                        <div className="edit-list">
                            {items.map(item => (
                                <div key={item.id} className={`edit-list-item-container ${expandedItemId === item.id ? 'expanded' : ''}`}>
                                    <div className="edit-list-item" onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}>
                                        <div className="item-info">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-cycle">{getCycleLabel(item.cycle)}</span>
                                        </div>
                                        <div className="item-actions">
                                            {expandedItemId === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            <button className="delete-btn" onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteItem(item.id);
                                            }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {expandedItemId === item.id && (
                                        <div className="item-edit-panel">
                                            <CycleSelector
                                                value={item.cycle}
                                                onChange={(newCycle) => handleUpdateItemCycle(item.id, newCycle)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Add New Item Input */}
                            {isAdding && (
                                <div className="add-item-container">
                                    <div className="add-item-row">
                                        <input
                                            type="text"
                                            placeholder="영양제 이름"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            className="add-input"
                                            autoFocus
                                        />
                                    </div>
                                    <CycleSelector
                                        value={newItemCycle}
                                        onChange={setNewItemCycle}
                                    />
                                    <div className="add-actions">
                                        <button className="cancel-add-btn" onClick={() => setIsAdding(false)}>취소</button>
                                        <button className="confirm-add-btn" onClick={handleAddItem}>확인</button>
                                    </div>
                                </div>
                            )}

                            {items.length === 0 && !isAdding && (
                                <p className="empty-msg">등록된 영양제가 없습니다.</p>
                            )}
                        </div>
                    </section>
                </div>

                <div className="modal-footer">
                    <button className="save-btn-full" onClick={handleSave}>
                        저장하기
                    </button>
                </div>
            </div>
        </div>
    );
}
