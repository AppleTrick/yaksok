import { MedicationItem, Cycle } from '../types';

export interface ValidationError {
    field: string;
    message: string;
}

/**
 * 일정 설정 전체 유효성 검사
 * @param time - 시간 (HH:mm)
 * @param items - 약 목록
 * @returns 유효성 검사 오류 배열
 */
export const validateScheduleSettings = (
    time: string,
    items: MedicationItem[]
): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!time || !validateTimeFormat(time)) {
        errors.push({ field: 'time', message: '시간을 선택해주세요' });
    }

    if (items.length === 0) {
        errors.push({ field: 'items', message: '최소 1개의 영양제를 추가해주세요' });
    }

    items.forEach((item, index) => {
        const cycleErrors = validateCycleData(item.cycle);
        if (cycleErrors.length > 0) {
            errors.push({
                field: `items[${index}].cycle`,
                message: cycleErrors[0]
            });
        }
    });

    return errors;
};

/**
 * 시간 형식 검증 (HH:mm)
 * @param time - 시간 문자열
 * @returns 유효 여부
 */
export const validateTimeFormat = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
};

/**
 * 주기 데이터 유효성 검사
 * @param cycle - 주기 데이터
 * @returns 오류 메시지 배열
 */
export const validateCycleData = (cycle: Cycle): string[] => {
    const errors: string[] = [];

    if (cycle.type === 'weekly') {
        if (!cycle.daysOfWeek || cycle.daysOfWeek.length === 0) {
            errors.push('요일을 선택해주세요');
        }
    }

    if (cycle.type === 'interval') {
        if (!cycle.interval || cycle.interval < 1) {
            errors.push('간격을 입력해주세요');
        }
        if (!cycle.startDate) {
            errors.push('시작 날짜를 선택해주세요');
        }
    }

    return errors;
};
