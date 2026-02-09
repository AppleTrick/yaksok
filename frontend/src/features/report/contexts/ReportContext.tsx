"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// 분석된 제품 정보
interface DetectedProduct {
    name: string;
    confidence: number;
    box: number[];
}

// 분석 결과 전체 (Spring Boot 통합 응답의 data 필드 구조)
interface AnalysisResult {
    displayData: {
        objectCount: number;
        products: DetectedProduct[];
    };
    reportData: {
        products: any[];
        overdoseAnalysis: any;
    };
}

// 리포트 데이터 (Mock 기반)
interface ReportData {
    analysisResult: AnalysisResult | null;
    capturedImage: string | null;
}

interface ReportContextType {
    reportData: ReportData;
    setReportData: (data: ReportData) => void;
    clearReportData: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export function ReportProvider({ children }: { children: ReactNode }) {
    const [reportData, setReportDataState] = useState<ReportData>({
        analysisResult: null,
        capturedImage: null,
    });

    const setReportData = (data: ReportData) => {
        setReportDataState(data);
    };

    const clearReportData = () => {
        setReportDataState({
            analysisResult: null,
            capturedImage: null,
        });
    };

    return (
        <ReportContext.Provider value={{ reportData, setReportData, clearReportData }}>
            {children}
        </ReportContext.Provider>
    );
}

export function useReportContext() {
    const context = useContext(ReportContext);
    if (!context) {
        throw new Error('useReportContext must be used within a ReportProvider');
    }
    return context;
}
