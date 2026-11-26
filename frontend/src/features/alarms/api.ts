import axios from '@/lib/axios';

export type AlarmCategory = 'BEFOREMEAL' | 'AFTERMEAL' | 'BEFORESLEEP';

export interface Alarm {
    id: number;
    userProductId: number;
    nickname: string;
    intakeTime: string | null; // "HH:mm:ss"
    enabled: boolean;
    intaken: boolean;
    category: AlarmCategory;
    daysOfWeek: string | null; // "1,3,5" (1=월), 비어 있으면 매일
}

export interface QuietHours {
    quietStart: string;
    quietEnd: string;
    enabled: boolean;
}

const BASE = '/api/v1/notification';

export const CATEGORY_LABEL: Record<AlarmCategory, string> = {
    BEFOREMEAL: '식전',
    AFTERMEAL: '식후',
    BEFORESLEEP: '자기 전',
};

export const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export const parseDays = (v: string | null): number[] => (v ? v.split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7]);

export const describeDays = (days: number[]): string => {
    const sorted = [...days].sort();
    const key = sorted.join('');
    if (key === '1234567') return '매일';
    if (key === '12345') return '평일';
    if (key === '67') return '주말';
    return sorted.map((d) => DAY_LABELS[d - 1]).join('·');
};

export const runsToday = (alarm: Alarm, now: Date): boolean => parseDays(alarm.daysOfWeek).includes(now.getDay() || 7);

export const formatTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(m).padStart(2, '0')}`;
};

export const fetchAlarms = async (): Promise<Alarm[]> => (await axios.get(`${BASE}/info`)).data.data.notifications ?? [];

export const toggleAlarm = (notificationId: number) => axios.put(`${BASE}/enable/toggle`, { notificationId });

export const saveAlarm = (alarm: Alarm, time: string, category: AlarmCategory, days: number[]) =>
    axios.put(`${BASE}/edit`, {
        notificationId: alarm.id,
        userProductId: alarm.userProductId,
        intakeTime: `${time.slice(0, 5)}:00`,
        category,
        daysOfWeek: days,
    });

export const deleteAlarm = (notificationId: number) => axios.delete(`${BASE}/delete`, { params: { notificationId } });

export const fetchQuietHours = async (): Promise<QuietHours> => (await axios.get(`${BASE}/setting`)).data.data;

export const saveQuietHours = (q: QuietHours) => axios.put(`${BASE}/setting`, { notificationId: 0, ...q });
