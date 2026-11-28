"use client";

import React, { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import type { ReportItem } from '@/features/scan/types';

/** 분석 결과에서 사용자가 고른 제품들. 리포트 화면이 이것으로 등록까지 한다. */
interface ReportData {
    items: ReportItem[];
    capturedImage: string | null;
}

interface ReportContextType {
    reportData: ReportData;
    setReportData: (data: ReportData) => void;
    clearReportData: () => void;
}

const EMPTY: ReportData = { items: [], capturedImage: null };
const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
    const [reportData, setReportData] = useState<ReportData>(EMPTY);
    const clearReportData = useCallback(() => setReportData(EMPTY), []);
    return (
        <ReportContext.Provider value={{ reportData, setReportData, clearReportData }}>
            {children}
        </ReportContext.Provider>
    );
}

export function useReportContext() {
    const context = useContext(ReportContext);
    if (!context) throw new Error('useReportContext must be used within a ReportProvider');
    return context;
}
