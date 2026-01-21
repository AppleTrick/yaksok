"use client";

import React, { useState, useEffect } from 'react';
import TimePicker from '@/components/TimePicker';
import { X, Plus, Trash2 } from 'lucide-react';
import { ScheduleItem } from '@/components/ScheduleCard';
import './modal.css';

interface ScheduleEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTime: string; // "14:00" (24h format for picker logic)
    initialItems: ScheduleItem[];
    onSave: (time: string, items: ScheduleItem[]) => void;
}

export default function ScheduleEditModal({ isOpen, onClose, initialTime, initialItems, onSave }: ScheduleEditModalProps) {
    const [time, setTime] = useState(initialTime);
    const [items, setItems] = useState<ScheduleItem[]>(initialItems);
    const [newItemName, setNewItemName] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTime(initialTime);
            setItems(initialItems);
            setNewItemName("");
            setIsAdding(false);
        }
    }, [isOpen, initialTime, initialItems]);

    if (!isOpen) return null;

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleAddItem = () => {
        if (!newItemName.trim()) return;
        const newItem: ScheduleItem = {
            id: Date.now().toString(),
            name: newItemName.trim()
        };
        setItems(prev => [...prev, newItem]);
        setNewItemName("");
        setIsAdding(false);
    };

    const handleSave = () => {
        onSave(time, items);
        onClose();
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
                                <div key={item.id} className="edit-list-item">
                                    <span>{item.name}</span>
                                    <button className="delete-btn" onClick={() => handleDeleteItem(item.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            {/* Add New Item Input */}
                            {isAdding && (
                                <div className="add-item-row">
                                    <input
                                        type="text"
                                        placeholder="영양제 이름"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        className="add-input"
                                        autoFocus
                                    />
                                    <button className="confirm-add-btn" onClick={handleAddItem}>확인</button>
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
