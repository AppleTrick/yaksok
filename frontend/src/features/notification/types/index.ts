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
    // Extended fields for "My Supplements"
    imageUrl?: string;
    efficacy?: string; // e.g., "혈압 조절", "눈 건강"
    cautions?: string; // e.g., "공복 섭취 금지"
    category?: string; // e.g., "비타민", "유산균"
    status?: 'taking' | 'stopped'; // Default to 'taking' if undefined
}

export interface MedicationSchedule {
    id: string;
    label: string; // "아침", "점심", "저녁", etc.
    time: string; // "HH:mm" 24h format
    rawTime: string; // "14:00"
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
    { id: 'morning', label: '아침', time: '오전 08:00', rawTime: '08:00', isEnabled: true },
    { id: 'lunch', label: '점심', time: '오후 01:00', rawTime: '13:00', isEnabled: true },
    { id: 'dinner', label: '저녁', time: '오후 07:00', rawTime: '19:00', isEnabled: true },
];

export const DEFAULT_SETTINGS: NotificationSettings = {
    pushEnabled: true,
    missedNotification: false,
    dndEnabled: false,
    dndStartTime: '22:00',
    dndEndTime: '07:00',
    schedules: DEFAULT_SCHEDULES,
};
