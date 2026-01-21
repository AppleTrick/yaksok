import { NotificationSettings, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'yaksok_notification_settings';

export const getNotificationSettings = async (): Promise<NotificationSettings> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    try {
        return JSON.parse(stored);
    } catch {
        return DEFAULT_SETTINGS;
    }
};

export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    // TODO: Call actual Backend API here
    // await fetch('/api/v1/notifications/settings', { ... })
};
