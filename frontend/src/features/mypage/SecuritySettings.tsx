'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck, UserX } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import Button from '@/components/Button';
import { changePassword, withdrawUser } from '@/services/userService';
import './styles.css';

export default function SecuritySettings() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const validatePassword = (password: string) => {
        const regex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
        return regex.test(password);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("모든 필드를 입력해 주세요.");
            return;
        }

        if (!validatePassword(newPassword)) {
            alert("새 비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("새 비밀번호가 일치하지 않습니다.");
            return;
        }

        setSubmitting(true);
        const success = await changePassword(currentPassword, newPassword);
        if (success) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            alert("비밀번호 변경에 실패했습니다. 현재 비밀번호를 다시 확인해 주세요.");
        }
        setSubmitting(false);
    };

    const handleWithdrawal = async () => {
        if (confirm("정말로 탈퇴하시겠습니까? 모든 데이터가 영구적으로 삭제됩니다.")) {
            setSubmitting(true);
            const success = await withdrawUser();
            if (success) {
                alert("회원 탈퇴가 완료되었습니다.");
                router.push('/login');
            } else {
                alert("회원 탈퇴 처리 중 오류가 발생했습니다.");
            }
            setSubmitting(false);
        }
    };

    return (
        <div className="mypage-container">
            <header className="mypage-header">
                <button onClick={() => router.back()} className="back-button">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="header-title">계정 및 보안</h1>
                <div style={{ width: 40 }}></div>
            </header>

            <div className="info-sections">
                <section className="info-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                        <ShieldCheck size={20} color={COLORS.primary} />
                        <h2 className="section-title" style={{ margin: 0 }}>비밀번호 변경</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">현재 비밀번호</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="form-input"
                                placeholder="현재 비밀번호를 입력해주세요"
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="form-input"
                                placeholder="새 비밀번호를 입력해주세요"
                            />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">새 비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="form-input"
                                placeholder="새 비밀번호를 다시 입력해주세요"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={submitting}
                            style={{ marginTop: '0.5rem' }}
                        >
                            {submitting ? "처리 중..." : "비밀번호 변경하기"}
                        </Button>
                    </form>
                </section>

                <section className="info-section" style={{ marginTop: '20px', border: '1px solid #fee2e2' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                        <UserX size={20} color={COLORS.error} />
                        <h2 className="section-title" style={{ margin: 0, color: COLORS.error }}>회원 탈퇴</h2>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                        계정을 삭제하면 모든 기록(복용 정보, 질환 정보 등)이 사라지며 복구할 수 없습니다.
                    </p>
                    <button
                        className="logout-button-full"
                        style={{ padding: '0.9rem', fontSize: '0.9rem' }}
                        onClick={handleWithdrawal}
                        disabled={submitting}
                    >
                        탈퇴하기
                    </button>
                </section>
            </div>
        </div>
    );
}
