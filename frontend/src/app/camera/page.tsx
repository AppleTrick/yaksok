"use client";

import { useState } from "react";
import "@/features/camera/styles.css";
import CaptureStep from "@/features/camera/components/CaptureStep";
import ReviewStep from "@/features/camera/components/ReviewStep";

import ResultStep from "@/features/camera/components/ResultStep";

type CameraFlowStep = 'capture' | 'review' | 'result';

export default function CameraPage() {
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

      const apiResponse = await fetch("/ai/v1/analyze", {
        method: "POST",
        body: formData,
      });

      if (!apiResponse.ok) throw new Error(`HTTP error! status: ${apiResponse.status}`);

      const data = await apiResponse.json();
      setAnalysisResult(data);
      setStep('result');
    } catch (error) {
      console.error("Upload error:", error);
      alert("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
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
