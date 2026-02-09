import { NotificationSettings, DEFAULT_SETTINGS } from '../types';
import { createNotificationSetting, NotificationSettingRequest } from './notificationApi';

const STORAGE_KEY = 'yaksok_notification_settings';

// Re-export API functions
export * from './notificationApi';

/**
 * Get Notification Settings
 * 
 * NOTE: The Backend API does not currently provide an endpoint to retrieve global settings (DND, Schedules).
 * Therefore, we persist this data in LocalStorage for the UI.
 */
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;

    try {
        return JSON.parse(stored);
    } catch {
        return DEFAULT_SETTINGS;
    }
};

/**
 * Save Notification Settings
 * 
 * Persists to LocalStorage AND syncs relevant parts (DND) to Backend.
 */
export const saveNotificationSettings = async (settings: NotificationSettings): Promise<void> => {
    // 1. Save to LocalStorage (Source of Truth for UI)
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    // 2. Sync to Backend (DND Settings)
    // Spec: POST /api/v1/notification/setting { quietStart, quietEnd }
    try {
        if (settings.dndEnabled) {
            const apiData: NotificationSettingRequest = {
                quietStart: settings.dndStartTime,
                quietEnd: settings.dndEndTime
            };
            await createNotificationSetting(apiData);
        }
    } catch (error) {
        console.error('⚠️ Failed to sync settings to backend (UI saved locally):', error);
    }
};
