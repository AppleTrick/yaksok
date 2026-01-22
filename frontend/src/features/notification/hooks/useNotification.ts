import { useEffect, useRef, useState } from 'react';
import { useNotificationSettings } from './useNotificationSettings';

export function useNotification() {
    const { settings } = useNotificationSettings();
    const [activeAlert, setActiveAlert] = useState<{ title: string; body: string } | null>(null);
    const lastCheckedMinute = useRef<string | null>(null);

    // 1. Request Permission
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    // 2. Schedule/Check Logic
    useEffect(() => {
        if (!settings.schedules || settings.schedules.length === 0) return;

        const checkTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${hours}:${minutes}`;

            if (lastCheckedMinute.current === currentTime) return;
            lastCheckedMinute.current = currentTime;

            const matching = settings.schedules.find(
                s => s.isEnabled && s.time === currentTime
            );

            if (matching) {
                triggerNotification(matching.label || '약 복용 시간입니다');
            }
        };

        const interval = setInterval(checkTime, 10000); // 10s check
        return () => clearInterval(interval);
    }, [settings.schedules]);

    // 3. Trigger Function
    const triggerNotification = (message: string) => {
        const title = "건강 비서 알림";

        // In-App
        setActiveAlert({ title, body: message });
        setTimeout(() => setActiveAlert(null), 5000);

        // System (PWA/Browser)
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            // Check for Service Worker registration for "true" PWA notification if available, 
            // otherwise fallback to new Notification()
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, {
                        body: message,
                        icon: '/icons/icon-192x192.png',
                        vibrate: [200, 100, 200]
                    } as any);
                });
            } else {
                new Notification(title, { body: message, icon: '/icons/icon-192x192.png' });
            }
        }
    };

    return { activeAlert };
}
