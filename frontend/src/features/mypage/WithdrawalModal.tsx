'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { COLORS } from '@/constants/colors';
import { login } from '@/services/authService';
import { withdrawUser } from '@/services/userService';
import { useRouter } from 'next/navigation';
import './WithdrawalModal.css';

interface Props {
    email: string;
    onClose: () => void;
}

export default function WithdrawalModal({ email, onClose }: Props) {
    const router = useRouter(); // Use App Router hook
    const [password, setPassword] = useState('');
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleWithdraw = async () => {
        if (!isConsentChecked) return;
        if (!password) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Verify password using login API
            const loginRes = await login(email, password);
            if (!loginRes.success) {
                alert("비밀번호가 일치하지 않습니다.");
                setIsLoading(false);
                return;
            }

            // 2. Perform withdrawal
            // withdrawUser now returns boolean
            const success = await withdrawUser();

            if (success) {
                alert("회원 탈퇴가 완료되었습니다.");
                // Force a hard refresh or move to login
                window.location.href = '/login';
            } else {
                alert("회원 탈퇴 처리 중 오류가 발생했습니다.");
            }
        } catch (e) {
            console.error(e);
            alert("오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <AlertTriangle size={24} color={COLORS.error} />
                    <h2 className="modal-title" style={{ margin: 0 }}>회원 탈퇴</h2>
                </div>

                <div className="warning-box">
                    <p className="warning-text">
                        탈퇴 시 <strong>모든 복용 기록, 사용자 설정, 건강 정보</strong>가
                        즉시 파기되며 복구할 수 없습니다.<br /><br />
                        정말로 탈퇴하시겠습니까?
                    </p>
                </div>

                <label className="consent-label">
                    <input
                        type="checkbox"
                        className="consent-checkbox"
                        checked={isConsentChecked}
                        onChange={e => setIsConsentChecked(e.target.checked)}
                    />
                    <span>위 내용을 확인하였으며, 탈퇴에 동의합니다.</span>
                </label>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="password"
                        className="form-input"
                        placeholder="비밀번호를 입력하여 본인 확인"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <div className="modal-actions">
                    <button className="cancel-button" onClick={onClose}>
                        취소
                    </button>
                    <button
                        className="confirm-button"
                        onClick={handleWithdraw}
                        disabled={!isConsentChecked || !password || isLoading}
                    >
                        {isLoading ? "처리 중..." : "탈퇴하기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
