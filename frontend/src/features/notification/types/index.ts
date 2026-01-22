export type CycleType = 'daily' | 'weekly' | 'interval';

export interface Cycle {
    type: CycleType;
    daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (used for 'weekly')
    interval?: number;     // e.g., 3 creates "every 3 days" (used for 'interval')
    startDate?: string;    // ISO Date string "YYYY-MM-DD" for interval calculation
}

export interface MedicationItem {
    id: string;
    name: string;
    detail?: string;
    isTaken: boolean;
    cycle: Cycle;
}

export interface MedicationSchedule {
    id: string;
    label: string; // "아침", "점심", "저녁", etc.
    time: string; // "HH:mm" 24h format
    isEnabled: boolean;
}

export interface NotificationSettings {
    pushEnabled: boolean;
    missedNotification: boolean;
    dndEnabled: boolean;
    dndStartTime: string; // "HH:mm"
    dndEndTime: string; // "HH:mm"
    schedules: MedicationSchedule[];
}

export const DEFAULT_SCHEDULES: MedicationSchedule[] = [
    { id: 'morning', label: '아침', time: '08:00', isEnabled: true },
    { id: 'lunch', label: '점심', time: '13:00', isEnabled: true },
    { id: 'dinner', label: '저녁', time: '19:00', isEnabled: true },
];

export const DEFAULT_SETTINGS: NotificationSettings = {
    pushEnabled: true,
    missedNotification: false,
    dndEnabled: false,
    dndStartTime: '22:00',
    dndEndTime: '07:00',
    schedules: DEFAULT_SCHEDULES,
};
