'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import Button from '@/components/Button';
import { fetchUserInfo, updateUserInfo, UserInfo } from '@/services/userService';
import './styles.css'; // Reusing mypage styles for consistency

export default function EditProfile() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState('');
    const [ageGroup, setAgeGroup] = useState('20~29');
    const [gender, setGender] = useState('male');

    useEffect(() => {
        const loadUser = async () => {
            const user = await fetchUserInfo();
            if (user) {
                setName(user.name);
                if (user.ageGroup) setAgeGroup(user.ageGroup);
                if (user.gender) setGender(user.gender);
            }
            setLoading(false);
        };
        loadUser();
    }, []);

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
            gender
        });

        if (success) {
            alert("정보가 수정되었습니다.");
            router.push('/mypage');
        } else {
            alert("정보 수정에 실패했습니다.");
        }
        setSubmitting(false);
    };

    if (loading) return <div style={{ padding: 20 }}>로딩 중...</div>;

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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>닉네임</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="닉네임을 입력하세요"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${COLORS.lightGray}`,
                            fontSize: '16px'
                        }}
                    />
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>연령대</label>
                    <select
                        value={ageGroup}
                        onChange={(e) => setAgeGroup(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: `1px solid ${COLORS.lightGray}`,
                            fontSize: '16px',
                            backgroundColor: 'white'
                        }}
                    >
                        <option value="0~9">10대 미만</option>
                        <option value="10~19">10대</option>
                        <option value="20~29">20대</option>
                        <option value="30~39">30대</option>
                        <option value="40~49">40대</option>
                        <option value="50~59">50대</option>
                        <option value="60~">60대 이상</option>
                    </select>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>성별</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={() => setGender('male')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: `1px solid ${gender === 'male' ? COLORS.primary : COLORS.lightGray}`,
                                backgroundColor: gender === 'male' ? COLORS.primary : 'white',
                                color: gender === 'male' ? 'white' : 'black',
                                cursor: 'pointer'
                            }}
                        >
                            남성
                        </button>
                        <button
                            type="button"
                            onClick={() => setGender('female')}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '8px',
                                border: `1px solid ${gender === 'female' ? COLORS.primary : COLORS.lightGray}`,
                                backgroundColor: gender === 'female' ? COLORS.primary : 'white',
                                color: gender === 'female' ? 'white' : 'black',
                                cursor: 'pointer'
                            }}
                        >
                            여성
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '20px' }}>
                    <Button
                        onClick={() => { }} // Form submit handles this
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
