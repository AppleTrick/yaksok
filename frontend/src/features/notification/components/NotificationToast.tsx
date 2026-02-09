'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

interface NotificationToastProps {
    data: {
        title: string;
        body: string;
        notificationIds: number[];
        userProductIds: number[];
    };
    onConfirm: (notificationIds: number[], productIds: number[]) => void;
    onSnooze: (notificationIds: number[]) => void;
    onClose: () => void;
}

export default function NotificationToast({ data, onConfirm, onSnooze, onClose }: NotificationToastProps) {
    // 15초 후 자동 닫기
    useEffect(() => {
        const timer = setTimeout(onClose, 15000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="notification-toast-wrapper">
            <div className="notification-toast">
                <div className="toast-header">
                    <div className="toast-brand">
                        <Image src="/icons/logo.png" alt="Logo" width={20} height={20} className="toast-logo" />
                        <span className="toast-app-name">약속 (Yak-Sok)</span>
                    </div>
                    <button onClick={onClose} className="toast-close-btn">×</button>
                </div>

                <div className="toast-body">
                    <h4 className="toast-title">{data.title}</h4>
                    <p className="toast-content">{data.body}</p>
                </div>

                <div className="toast-actions">
                    {/* 버튼 순서 변경: 미루기(좌), 복용(우) */}
                    <button
                        onClick={() => { onSnooze(data.notificationIds); onClose(); }}
                        className="toast-btn snooze"
                    >
                        ⏰ 나중에
                    </button>
                    <button
                        onClick={() => { onConfirm(data.notificationIds, data.userProductIds); onClose(); }}
                        className="toast-btn confirm"
                    >
                        ✅ 지금 복용
                    </button>
                </div>
            </div>

            <style jsx>{`
                .notification-toast-wrapper {
                    position: fixed;
                    z-index: 2147483647;
                    pointer-events: auto;
                    width: 90%;
                    max-width: 360px;
                }

                /* Mobile (Default): Top Center */
                @media (max-width: 768px) {
                    .notification-toast-wrapper {
                        top: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                    }
                    .notification-toast {
                        animation: toastBounceInTop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                    }
                }

                /* PC: Bottom Right */
                @media (min-width: 769px) {
                    .notification-toast-wrapper {
                        bottom: 30px;
                        right: 30px;
                    }
                    .notification-toast {
                        animation: toastSlideInRight 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    }
                }

                .notification-toast {
                    background: #ffffff;
                    border-radius: 20px;
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
                    padding: 18px;
                    border: 1px solid rgba(0, 0, 0, 0.08);
                }

                @keyframes toastBounceInTop {
                    from { transform: translateY(-120%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                @keyframes toastSlideInRight {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                .toast-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .toast-brand {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .toast-app-name {
                    font-size: 11px;
                    font-weight: 700;
                    color: #888;
                    letter-spacing: -0.02em;
                }

                .toast-close-btn {
                    background: #f0f0f0;
                    border: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    font-size: 16px;
                    color: #666;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .toast-body {
                    margin-bottom: 14px;
                }

                .toast-title {
                    margin: 0 0 2px 0;
                    font-size: 16px;
                    font-weight: 800;
                    color: #000;
                }

                .toast-content {
                    margin: 0;
                    font-size: 14px;
                    color: #333;
                    line-height: 1.4;
                }

                .toast-actions {
                    display: flex;
                    gap: 10px;
                }

                .toast-btn {
                    flex: 1;
                    padding: 10px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 700;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .toast-btn.snooze {
                    background: #f5f5f5;
                    color: #555;
                }

                .toast-btn.confirm {
                    background: #000;
                    color: white;
                }

                .toast-btn:active {
                    transform: scale(0.96);
                }
            `}</style>
        </div>
    );
}
