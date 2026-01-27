import React, { useState } from 'react';
import { useScheduleContext } from '@/features/notification/contexts/ScheduleContext';
import { MedicationItem } from '@/features/notification/types';
import TimePicker from '@/components/TimePicker';
import { searchSupplements } from '../api/searchApi';
import { MockSupplement } from '../api/mockData';
import { Search, Loader2 } from 'lucide-react';
import '../styles.css';

interface ManualRegistrationFormProps {
    onClose: () => void;
}

export default function ManualRegistrationForm({ onClose }: ManualRegistrationFormProps) {
    const { addMedication } = useScheduleContext();
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [efficacy, setEfficacy] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [dosage, setDosage] = useState(1);
    const [time, setTime] = useState('08:00'); // Default 8:00 AM

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MockSupplement[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Handle Search
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.trim().length === 0) {
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }

        setIsSearching(true);
        setIsSearchOpen(true);
        try {
            const results = await searchSupplements(query);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    };

    const selectSupplement = (item: MockSupplement) => {
        setName(item.name);
        setCategory(item.category || '');
        setEfficacy(item.efficacy || '');
        setIngredients(item.ingredients || '');
        setSearchQuery(''); // Clear search to hide list
        setIsSearchOpen(false);
    };

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
            ingredients: ingredients.trim() || undefined,
            dosage: dosage,
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
            <h3 className="form-title">영양제 등록</h3>

            {/* Search Section */}
            <div className="search-section" style={{ position: 'relative', marginBottom: '1rem' }}>
                <div className="form-group">
                    <label>영양제 검색 (선택)</label>
                    <div className="search-input-wrapper" style={{ position: 'relative' }}>
                        <Search className="search-icon-small" size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="제품명, 성분으로 검색..."
                            className="form-input"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                        {isSearching && (
                            <Loader2 className="animate-spin" size={18} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#FB923C' }} />
                        )}
                    </div>
                </div>

                {/* Search Results Dropdown */}
                {isSearchOpen && (
                    <div className="search-results-dropdown" style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 50,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {searchResults.length > 0 ? (
                            searchResults.map((item, idx) => (
                                <div
                                    key={idx}
                                    className="search-result-item"
                                    onClick={() => selectSupplement(item)}
                                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                                >
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
                                        {[item.category, item.ingredients].filter(Boolean).join(' | ')}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', textAlign: 'center', color: '#6B7280', fontSize: '0.9rem' }}>
                                검색 결과가 없습니다.<br />
                                정보를 직접 입력해주세요.
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="form-separator" style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '0.5rem 0 1.5rem 0' }}></div>

            <div className="form-group">
                <label>제품명 (필수)</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="직접 입력 또는 검색 선택"
                    className="form-input"
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
                <label>성분/함량</label>
                <input
                    type="text"
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="예: 비타민C 1000mg"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label>한 번에 몇 알 드시나요?</label>
                <div className="dosage-counter-container">
                    <button
                        type="button"
                        className="counter-btn"
                        onClick={() => setDosage(Math.max(1, dosage - 1))}
                        disabled={dosage <= 1}
                    >
                        -
                    </button>
                    <span className="dosage-value">{dosage} 정 (알)</span>
                    <button
                        type="button"
                        className="counter-btn"
                        onClick={() => setDosage(dosage + 1)}
                    >
                        +
                    </button>
                </div>
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
                <button type="submit" className="submit-btn" disabled={!name}>등록하기</button>
            </div>
        </form>
    );
}
