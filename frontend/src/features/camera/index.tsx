"use client";

import { useState } from "react";
import "./styles.css";
import CaptureStep from "./components/CaptureStep";
import ReviewStep from "./components/ReviewStep";
import ResultStep from "./components/ResultStep";

type CameraFlowStep = 'capture' | 'review' | 'result';

export default function CameraFeature() {
    const [step, setStep] = useState<CameraFlowStep>('capture');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleCapture = (imageDataUrl: string) => {
        setCapturedImage(imageDataUrl);
        setStep('review');
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setAnalysisResult(null);
        setStep('capture');
        setIsAnalyzing(false);
    };

    const handleConfirm = async () => {
        if (!capturedImage) return;

        setIsAnalyzing(true);
        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("file", blob, "captured.jpg");

            console.log("[DEBUG] Feature Fetching /ai/v1/analyze...");
            const apiResponse = await fetch("/ai/v1/analyze", {
                method: "POST",
                body: formData,
            });

            console.log("[DEBUG] Feature Response status:", apiResponse.status);

            if (!apiResponse.ok) {
                const errorText = await apiResponse.text();
                console.error("[DEBUG] Feature Error response body:", errorText);
                throw new Error(`HTTP error! status: ${apiResponse.status}, body: ${errorText}`);
            }

            const data = await apiResponse.json();
            console.log("[DEBUG] Feature Analysis data received:", data);
            setAnalysisResult(data);
            setStep('result');
        } catch (error: any) {
            console.error("Upload error detail:", error);
            alert(`분석 중 오류가 발생했습니다: ${error.message || error}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleRegister = () => {
        alert("영양제가 등록되었습니다! (홈으로 이동)");
        window.location.href = "/";
    };

    // Render Steps
    switch (step) {
        case 'capture':
            return (
                <CaptureStep
                    onCapture={handleCapture}
                    onFileUpload={handleCapture}
                />
            );
        case 'review':
            return capturedImage && (
                <ReviewStep
                    imageSrc={capturedImage}
                    isAnalyzing={isAnalyzing}
                    onRetake={handleRetake}
                    onConfirm={handleConfirm}
                />
            );
        case 'result':
            return capturedImage && analysisResult && (
                <ResultStep
                    imageSrc={capturedImage}
                    result={analysisResult}
                    onRetake={handleRetake}
                    onRegister={handleRegister}
                />
            );
        default:
            return null;
    }
}
