import React from 'react';
import { Pill, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MedicationItem, Cycle } from '@/features/notification/types';
import Modal from '@/components/Modal';
import '../styles.css';

interface SupplementDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: MedicationItem; // Valid merged item
    relatedSchedules: { label: string; time: string; cycle: Cycle }[];
    onDelete: () => void;
    onToggleStatus: (newStatus: 'taking' | 'stopped') => void;
}

const SupplementDetailModal: React.FC<SupplementDetailModalProps> = ({
    isOpen,
    onClose,
    item,
    relatedSchedules,
    onDelete,
    onToggleStatus
}) => {
    // Helper to format cycle text
    const getCycleText = (cycle: Cycle) => {
        if (cycle.type === 'daily') return '매일';
        if (cycle.type === 'weekly') {
            const days = ['일', '월', '화', '수', '목', '금', '토'];
            return cycle.daysOfWeek?.map(d => days[d]).join(', ') + '요일';
        }
        if (cycle.type === 'interval') return `${cycle.interval}일 간격`;
        return '설정 없음';
    };

    const footer = (
        <div className="modal-actions">
            <button
                className={`action-btn ${item.status === 'stopped' ? 'resume' : 'stop'}`}
                onClick={() => onToggleStatus(item.status === 'stopped' ? 'taking' : 'stopped')}
                style={{
                    backgroundColor: item.status === 'stopped' ? '#22C55E' : '#F59E0B',
                    color: 'white'
                }}
            >
                {item.status === 'stopped' ? '복용 재개' : '복용 중단'}
            </button>
            <button className="action-btn delete" onClick={() => {
                if (confirm("정말 이 영양제를 모든 일정에서 삭제하시겠습니까?")) {
                    onDelete();
                }
            }}>
                삭제하기
            </button>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} footer={footer}>
            {/* Hero Section: Icon & Name */}
            <div className="modal-hero">
                <div className="modal-icon-wrapper">
                    {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="supplement-img" />
                    ) : (
                        <Pill size={40} color="#FF5722" />
                    )}
                </div>
                <h2 className="modal-title">{item.name}</h2>
                <div className="modal-badges">
                    {item.efficacy && (
                        <span className="modal-badge efficacy">{item.efficacy}</span>
                    )}
                    {item.category && (
                        <span className="modal-badge category">{item.category}</span>
                    )}
                    {!item.efficacy && !item.category && (
                        <span className="modal-badge" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
                            상세 정보 없음
                        </span>
                    )}
                </div>
            </div>

            {/* Detail Information */}
            <div className="detail-section">
                <div className="section-label">
                    <AlertCircle size={16} />
                    <span>섭취 가이드 & 주의사항</span>
                </div>
                {item.cautions ? (
                    <div className="caution-box">
                        {item.cautions}
                    </div>
                ) : (
                    <div className="info-card">
                        <p>특별한 주의사항이 등록되지 않았습니다.</p>
                    </div>
                )}
            </div>

            {/* Ingredients Accordion */}
            {item.ingredients && (
                <div className="detail-section">
                    <details className="cm-accordion">
                        <summary className="cm-accordion-header">
                            <div className="section-label" style={{ marginBottom: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Pill size={16} />
                                    <span>성분/함량 정보</span>
                                </div>
                            </div>
                            <ChevronRight className="cm-accordion-icon" size={18} />
                        </summary>
                        <div className="cm-accordion-content">
                            {item.ingredients}
                        </div>
                    </details>
                </div>
            )}

            {/* Schedule List */}
            <div className="detail-section">
                <div className="section-label">
                    <Clock size={16} />
                    <span>섭취 일정</span>
                </div>
                <div className="schedule-list">
                    {relatedSchedules.length > 0 ? (
                        relatedSchedules.map((schedule, idx) => (
                            <Link href="/reminders" key={idx} className="schedule-item-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                                <span style={{ fontWeight: 600 }}>{schedule.label}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span className="schedule-time">{schedule.time}</span>
                                    <span className="schedule-cycle">{getCycleText(schedule.cycle)}</span>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="info-card">
                            등록된 일정이 없습니다.
                        </div>
                    )}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#9CA3AF', marginTop: '0.5rem', textAlign: 'center' }}>
                    일정을 누르면 알림 관리 페이지로 이동합니다.
                </p>
            </div>
        </Modal>
    );
};

export default SupplementDetailModal;
