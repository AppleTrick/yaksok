"use client";

import React, { useState } from 'react';
import NotificationModal from '@/components/NotificationModal';
import { useNotificationHandlers } from '../hooks/useNotificationHandlers';
import { useScheduleContext } from '../contexts/ScheduleContext';

export default function NotificationManagerEnhanced() {
    const [currentNotification, setCurrentNotification] = useState<{
        schedule: any;
        eventId: number;
    } | null>(null);

    const { handleConfirm, handleSnooze, snoozeBanner, dismissSnoozeBanner } = useNotificationHandlers();
    const { schedules } = useScheduleContext();

    return (
        <>
            {currentNotification && (
                <NotificationModal
                    isOpen={!!currentNotification}
                    onClose={() => setCurrentNotification(null)}
                    schedule={currentNotification.schedule}
                    eventId={currentNotification.eventId}
                    onConfirm={handleConfirm}
                    onSnooze={handleSnooze}
                />
            )}

            {snoozeBanner.visible && (
                <div className="snooze-banner" style={{
                    position: 'fixed',
                    bottom: '80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#FF5722',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    zIndex: 1000,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <p style={{ margin: 0, fontWeight: 500 }}>5분 후 다시 알림드립니다</p>
                    <button
                        onClick={dismissSnoozeBanner}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: 0,
                            lineHeight: 1
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 100%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
        </>
    );
}
