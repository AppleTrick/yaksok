'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import Button from '@/components/Button';
import { fetchUserInfo, updateUserInfo, Disease } from '@/services/userService';
import './styles.css';

export default function EditProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [ageGroup, setAgeGroup] = useState('THIRTY');
    const [gender, setGender] = useState('MALE');
    const [allDiseases, setAllDiseases] = useState<Disease[]>([]);
    const [selectedDiseaseIds, setSelectedDiseaseIds] = useState<number[]>([]);

    useEffect(() => {
        const loadUser = async () => {
            const data = await fetchUserInfo();
            if (data) {
                setName(data.userDataResponse.name);
                setAgeGroup(data.userDataResponse.ageGroup);
                setGender(data.userDataResponse.gender);
                setAllDiseases(data.allDiseases);
                setSelectedDiseaseIds(data.userDiseases.map(d => d.id));
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const toggleDisease = (id: number) => {
        setSelectedDiseaseIds(prev =>
            prev.includes(id) ? prev.filter(dId => dId !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        setSubmitting(true);
        const success = await updateUserInfo({
            name,
            ageGroup,
            gender,
            diseaseIds: selectedDiseaseIds
        });

        if (success) {
            alert("정보가 수정되었습니다.");
            router.push('/mypage');
        } else {
            alert("정보 수정에 실패했습니다.");
        }
        setSubmitting(false);
    };

    if (loading) return <div className="mypage-container" style={{ padding: 20 }}>로딩 중...</div>;

    return (
        <div className="mypage-container">
            <header className="mypage-header">
                <button onClick={() => router.back()} className="back-button">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">내 정보 수정</h1>
                <div style={{ width: 24 }}></div>
            </header>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                    <label className="form-label">닉네임</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">연령대</label>
                    <select
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        className="form-select"
                    >
                        <option value="TEEN">10대</option>
                        <option value="TWENTY">20대</option>
                        <option value="THIRTY">30대</option>
                        <option value="FORTY">40대</option>
                        <option value="FIFTY">50대</option>
                        <option value="SIXTY">60대 이상</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">성별</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={() => setGender('MALE')}
                            className={`gender-button ${gender === 'MALE' ? 'active' : ''}`}
                        >
                            남성
                        </button>
                        <button
                            type="button"
                            onClick={() => setGender('FEMALE')}
                            className={`gender-button ${gender === 'FEMALE' ? 'active' : ''}`}
                        >
                            여성
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">보유 질환</label>
                    <div className="disease-selection-grid">
                        {allDiseases.map(disease => (
                            <button
                                key={disease.id}
                                type="button"
                                onClick={() => toggleDisease(disease.id)}
                                className={`disease-select-item ${selectedDiseaseIds.includes(disease.id) ? 'selected' : ''}`}
                            >
                                {disease.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <Button
                        onClick={() => { }}
                        style={{ width: '100%' }}
                        disabled={submitting}
                    >
                        {submitting ? "저장 중..." : "저장하기"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
